/* 同 vue-cli-plugin-vusion 中的 */

const fs = require('fs');
const path = require('path');
const globby = require('globby');
const JS = require('javascript-stringify');

const kebab2Camel = (name) => name.replace(/(?:^|-)([a-zA-Z0-9])/g, (m, $1) => $1.toUpperCase());

exports.createRoute = function createRoute(routePath, flatRoutes, wrapper) {
    if (flatRoutes[routePath])
        return flatRoutes[routePath];

    const cap = routePath.match(/(.*)\/(.*)/);
    const [m, parentPath, currentPath] = cap || [null, '', routePath];

    const route = {
        path: currentPath,
        parentPath,
        routePath,
    };
    if (wrapper)
        route.fullPath = route.filePath = 'cloud-ui.vusion/src/layouts/l-wrapper.vue';

    return flatRoutes[routePath] = route;
};

exports.normalizeRoute = function normalizeRoute(routePath, route) {
    const cap = routePath.match(/(.*)\/(.*)/);
    const [m, parentPath, currentPath] = cap || [null, '', routePath];

    return Object.assign({
        path: currentPath,
        parentPath,
        routePath,
    }, route);
};

/**
 * 根本文件路由获取扁平文件管理
 * {
 *  '/aaa/',
 *  '/aaa/bbb',
 * }
 */
exports.getFlatRoutes = function (basePath, filters = {}) {
    // 这里本可以直接在递归目录时生成每一级路由
    // 但现在采用的是获取所有的扁平化路由，为了方便配置和合并
    const flatRoutes = {};
    globby.sync(['**/*.{vue,md}', '!**/*.vue/docs/*.md', '!**/*.blocks/**'], { cwd: basePath }).forEach((filePath) => {
        if (filters.excludes && filters.excludes.some((exclude) => filePath.includes(exclude)))
            return;

        filePath = filePath.replace(/\\/g, '/');
        const routePath = ('/' + filePath).replace(/(\/index)?\.(vue|md)$/, '').replace(/^\//, '');

        const route = exports.createRoute(routePath, flatRoutes);
        route.filePath = './' + filePath;
        route.fullPath = path.join(basePath, filePath);
    });

    return flatRoutes;
};

const _mergeFlatRoutes = function (routes1, routes2) {
    if (!routes2)
        return routes1;
    Object.keys(routes2).forEach((key) => {
        if (routes1[key]) {
            routes1[key] = Object.assign(routes1[key], routes2[key]);
        } else {
            key && console.warn('[routes-loader] Warning 该路由在目录结构中没有生成，请检查配置: ' + key);
            routes1[key] = routes2[key];
        }
    });
    return routes1;
};
/**
 * 合并扁平路由
 */
exports.mergeFlatRoutes = (...args) => args.reduceRight((acc, cur) => _mergeFlatRoutes(cur, acc));

/**
 * 将扁平路由转换为正常使用的嵌套路由
 */
exports.nestRoutes = function (flatRoutes, root) {
    const routes = [];

    const parse = function (route) {
        if (route.routePath === '')
            return;

        if (route.parentPath === undefined)
            route.parentPath = '';

        let parent = flatRoutes[route.parentPath];
        if (!parent) {
            parent = exports.createRoute(route.parentPath, flatRoutes, true);
            parse(parent);
        }

        parent.children = parent.children || [];
        parent.children.push(route);
    };

    Object.keys(flatRoutes).forEach((key) => parse(flatRoutes[key]));
    // 补充
    Object.keys(flatRoutes).forEach((key) => {
        const route = flatRoutes[key];
        if (route.children && route.children.length) {
            const firstChild = route.children.find((child) => child.first) || route.children[0];
            route.children.unshift({ path: '', redirect: firstChild.path });
        }
    });
    routes.push(flatRoutes['']);

    if (root) {
        routes[0].path = '/';
        routes.push({ path: '*', redirect: '/' });
    }

    return routes;
};

/**
 * 拼接为 JS 字符串
 */
exports.renderRoute = function (route) {
    const properties = [];
    properties.push(`path: '${route.path}'`);
    /* eslint-disable multiline-ternary */
    route.filePath && properties.push(route.chunkName
        ? `component: () => import(/* webpackChunkName: "${route.chunkName}" */ '${route.filePath.replace(/\\/g, '/')}')`
        : `component: require('${route.filePath.replace(/\\/g, '/')}').default`);
    route.name && properties.push(`name: '${route.name}'`);
    route.components && properties.push(`components: ${JS.stringify(route.components)}`);
    route.redirect && properties.push(`redirect: '${route.redirect}'`);
    route.props && properties.push(`props: ${JS.stringify(route.props)}`);
    route.alias && properties.push(`alias: '${route.alias}'`);
    route.children && properties.push(`children: ${exports.renderRoutes(route.children)}`);
    route.beforeEnter && properties.push(`beforeEnter: ${JS.stringify(route.beforeEnter)}`);
    route.meta && properties.push(`meta: ${JS.stringify(route.meta)}`);
    route.caseSensitive && properties.push(`caseSensitive: '${route.caseSensitive}'`);
    route.pathToRegexpOptions && properties.push(`pathToRegexpOptions: '${route.pathToRegexpOptions}'`);
    return `{ ${properties.join(', ')} }`;
};

/**
 * 拼接为 JS 字符串
 */
exports.renderRoutes = function (routes) {
    return '[\n' + routes.map((route) => exports.renderRoute(route)).join(',\n') + '\n]\n';
};

function ensureReadmePath(markdownPath) {
    if (!markdownPath.endsWith('/README.md')) // @multi: if (!markdownPath.endsWith('.vue/README.md'))
        return markdownPath;

    const yamlPath = path.join(markdownPath, '../api.yaml').replace(/\\/g, '/');
    if (fs.existsSync(yamlPath))
        return yamlPath;

    return markdownPath;
}

exports.normalizeMaterials = function (basePath, materials, type) {
    const isComponentsType = ['components', 'blocks', 'vendors', 'layouts'].includes(type);

    materials.forEach((material) => {
        const relativeReadmePath = (material.scope ? `@${material.scope}/` : '') + material.name + (isComponentsType ? '.vue/README.md' : '/README.md');

        if (material.path) {
            if (material.path[0] === '.')
                material.path = path.join(process.cwd(), material.path).replace(/\\/g, '/');
            else {
                // @compat:
                let libraryPath = basePath;
                if (basePath.endsWith(type))
                    libraryPath = path.dirname(basePath);
                material.path = material.path.replace(/^library/, libraryPath).replace(/^@/, process.cwd());
            }
        } else if (!material.href && !material.to)
            material.path = ensureReadmePath(path.resolve(basePath, relativeReadmePath).replace(/\\/g, '/'));

        if (material.path) {
            // 只验证完整路径
            if (path.isAbsolute(material.path) && !fs.existsSync(material.path)) {
                material.path = '';
                // @TODO: 临时解决方案，一般只从 cloud-ui 中扩展
                let depMarkdownPath;
                if (type !== 'vendors')
                    depMarkdownPath = ensureReadmePath(path.resolve(basePath, `../../node_modules/cloud-ui.vusion/src/${type}/` + relativeReadmePath).replace(/\\/g, '/'));
                else
                    depMarkdownPath = ensureReadmePath(path.resolve(basePath, `../../node_modules/cloud-ui.vusion/node_modules/` + relativeReadmePath).replace(/\\/g, '/'));
                if (fs.existsSync(depMarkdownPath))
                    material.path = depMarkdownPath;
            }

            const absolutePath = path.isAbsolute(material.path) || material.path[0] === '.' ? path.resolve(material.path) : path.resolve('node_modules', material.path);
            // subDocs
            const subDocsPath = path.join(absolutePath, '../docs');

            const subDocsExists = fs.existsSync(subDocsPath);
            const pathIsYaml = material.path.endsWith('/api.yaml'); // @multi: material.path.endsWith('.vue/api.yaml');
            if (subDocsExists || pathIsYaml) {
                material.children = [];

                if (subDocsExists) {
                    const subDocs = fs.readdirSync(subDocsPath);
                    subDocs.forEach((name) => {
                        if (name !== 'index.md' && name.endsWith('.md')) {
                            material.children.push({
                                path: name.replace(/\.md$/, ''),
                                fullPath: path.resolve(subDocsPath, name),
                            });
                        }
                    });
                }
                if (pathIsYaml) {
                    material.children.push({
                        path: 'api',
                        fullPath: material.path + '?yaml-doc=api',
                    });
                }
                const changelogPath = path.join(absolutePath, '../CHANGELOG.md');
                if (fs.existsSync(changelogPath)) {
                    material.children.push({
                        path: 'changelog',
                        fullPath: changelogPath,
                    });
                }

                // 设计第一个路由为默认的 redirect
                if (material.children[0] && !!material.children[0].path) {
                    if (material.children.find((route) => route.path === 'examples'))
                        material.children.unshift({ path: '', redirect: 'examples' });
                    else
                        material.children.unshift({ path: '', redirect: material.children[0].path });
                }
            }
        }

        material.CamelName = kebab2Camel(material.name); // .replace(/^u-/, ''));
    });

    return materials;
};

exports.getMaterials = function (basePath, materials, type) {
    const isComponentsType = ['components', 'blocks', 'vendors', 'layouts'].includes(type);

    if (!materials) { // 如果配置中没有 materials，则根据目录来生成
        if (isComponentsType) {
            const materialsMap = {};

            // 目录中的组件
            globby.sync(['*.vue'], { cwd: basePath })
                .forEach((fileName) => {
                    const vueName = fileName.slice(0, -4);
                    const markdownPath = path.resolve(basePath, fileName + '/README.md').replace(/\\/g, '/');
                    materialsMap[vueName] = {
                        name: vueName,
                        path: ensureReadmePath(markdownPath),
                    };
                });

            materials = Object.keys(materialsMap).map((vueName) => materialsMap[vueName]);
        } else
            return [];
    }

    exports.normalizeMaterials(basePath, materials, type);

    return materials;
};

exports.getMaterial = function (srcPath, type) {
    const isComponentsType = ['components', 'blocks', 'vendors', 'layouts'].includes(type);

    let materials = [];
    const materialsMap = {};

    // 目录中的组件
    const fileName = path.basename(srcPath);
    const vueName = fileName.replace(/\.vue$/, ''); // @multi: filePath.slice(0, -4);
    const markdownPath = path.resolve(srcPath + '/README.md').replace(/\\/g, '/');
    materialsMap[vueName] = {
        name: vueName,
        path: ensureReadmePath(markdownPath),
    };

    materials = Object.keys(materialsMap).map((vueName) => materialsMap[vueName]);

    exports.normalizeMaterials(srcPath, materials, type);

    return materials;
};

exports.groupMaterials = function (materials) {
    const groupsMap = {};
    materials.forEach((material) => {
        material.group = material.group || '';
        if (!groupsMap[material.group])
            groupsMap[material.group] = { name: material.group, children: [] };
        groupsMap[material.group].children.push(material);
    });
    return Object.keys(groupsMap).map((key) => groupsMap[key]);
};

exports.setChildren = function (route, materials) {
    route.children = materials.filter((material) => !!material.path).map((material) => ({
        path: material.name,
        fullPath: material.path,
        children: material.children,
        chunkName: (material.group || '').replace(/\s+/g, '_'),
    }));
    // 添加默认跳转路径
    if (route.children && route.children[0] && !!route.children[0].path)
        route.children.unshift({ path: '', redirect: route.children[0].path });
};
