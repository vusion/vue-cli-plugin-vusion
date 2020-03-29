const fs = require('fs');
const path = require('path');
const globby = require('globby');

const kebab2Camel = (name) => name.replace(/(?:^|-)([a-zA-Z0-9])/g, (m, $1) => $1.toUpperCase());

function createRoute(routePath, flatRoutes) {
    if (!routePath)
        routePath = '/';
    if (flatRoutes[routePath])
        return flatRoutes[routePath];

    let [m, parentPath, currentPath] = routePath.match(/(.*)\/(.*)/);
    if (routePath === '/')
        currentPath = '/';
    if (!parentPath)
        parentPath = '/';

    return flatRoutes[routePath] = {
        path: currentPath,
        parentPath,
        routePath,
    };
}

/**
 * 根本文件路由获取扁平文件管理
 * {
 *  '/aaa/',
 *  '/aaa/bbb',
 * }
 */
exports.getFlatRoutes = function (basePath) {
    // 这里本可以直接在递归目录时生成每一级路由
    // 但现在采用的是获取所有的扁平化路由，为了方便配置和合并
    const flatRoutes = {};
    globby.sync(['**/*.{vue,md}'], { cwd: basePath }).forEach((filePath) => {
        filePath = filePath.replace(/\\/g, '/');
        const routePath = ('/' + filePath).replace(/(\/index)?\.(vue|md)$/, '') || '/';

        const route = createRoute(routePath, flatRoutes);
        route.filePath = filePath;
        route.fullPath = path.join(basePath, filePath);
    });

    return flatRoutes;
};

const _mergeFlatRoutes = function (routes1, routes2) {
    if (!routes2)
        return routes1;
    Object.keys(routes2).forEach((key) => {
        routes1[key] = routes1[key] ? Object.assign(routes1[key], routes2[key]) : routes2[key];
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
exports.nestRoutes = function (flatRoutes) {
    const routes = [];

    const parse = function (route) {
        if (route.routePath === '/')
            return;

        let parent = flatRoutes[route.parentPath];
        if (!parent) {
            parent = createRoute(route.parentPath, flatRoutes);
            parent.fullPath = parent.filePath = require.resolve('cloud-ui.vusion/src/layouts/l-wrapper.vue/index.js').replace(/\\/g, '/');
            parse(parent);
        }

        parent.children = parent.children || [];
        parent.children.push(route);
    };

    Object.keys(flatRoutes).forEach((key) => parse(flatRoutes[key]));
    // 补充
    Object.keys(flatRoutes).forEach((key) => {
        const route = flatRoutes[key];
        if (route.children && !!route.children[0].path)
            route.children.unshift({ path: '', redirect: route.children[0].path });
    });
    routes.push(flatRoutes['/'], { path: '*', redirect: '/' });

    return routes;
};

/**
 * 拼接为 JS 字符串
 */
exports.renderRoutes = function (routes) {
    return '[\n' + routes.map((route) => {
        const properties = [];
        properties.push(`path: '${route.path}'`);
        /* eslint-disable multiline-ternary */
        route.fullPath && properties.push(route.chunkName
            ? `component: () => import(/* webpackChunkName: "${route.chunkName}" */ '${route.fullPath.replace(/\\/g, '/')}')`
            : `component: require('${route.fullPath.replace(/\\/g, '/')}').default`);
        route.children && properties.push(`children: ${exports.renderRoutes(route.children)}`);
        route.redirect && properties.push(`redirect: '${route.redirect}'`);
        route.alias && properties.push(`alias: '${route.alias}'`);
        return `{ ${properties.join(', ')} }`;
    }).join(',\n') + '\n]\n';
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
                .forEach((filePath) => {
                    const vueName = filePath.slice(0, -4);
                    const markdownPath = path.resolve(basePath, filePath + '/README.md').replace(/\\/g, '/');
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
    const filePath = path.basename(srcPath);
    const vueName = filePath.replace(/\.vue$/, ''); // @multi: filePath.slice(0, -4);
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
