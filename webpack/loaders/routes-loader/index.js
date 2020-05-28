const path = require('path');
const loaderUtils = require('loader-utils');

const _ = require('./utils');

const RESERVED_DIRS = [
    'layout',
    'assets',
    'components',
    'directives',
    'filters',
    'mixins',
    'utils',
    'styles',
    'service',
    'module',
];

const normalize = (routePath) => routePath
    .replace(/(^|\/)views\//g, '$1/')
    .replace(/(^|\/)_/g, '$1:')
    .replace(/_($|\/)/g, '?$1')
    .replace(/\$/g, '*');

// 生成routes，通过字符串拼接的形式
module.exports = function (content) {
    const options = loaderUtils.getOptions(this) || {};
    options.rootPath = options.rootPath || options.scopeName;
    options.chunkName = options.chunkName || options.scopeName;

    const resourceDir = path.dirname(this.resourcePath);

    // 动态生成路由
    const viewsPath = path.resolve(resourceDir, 'views');
    this.addContextDependency(viewsPath);
    const flatRoutes = _.getFlatRoutes(viewsPath, {
        excludes: RESERVED_DIRS.map((dir) => `/${dir}/`),
    });

    const handledFlatRoutes = {};
    Object.keys(flatRoutes).map((key) => {
        const route = flatRoutes[key];

        route.routePath = key = normalize(key);
        route.path = normalize(route.path);
        route.parentPath = normalize(route.parentPath);
        route.filePath = './' + path.join('views', route.filePath);
        route.chunkName = options.chunkName;

        handledFlatRoutes[key] = route;

        return route;
    });
    if (!handledFlatRoutes[''])
        _.createRoute('', handledFlatRoutes, true);

    let routesMap = {};
    try {
        const ctn = content.trim().replace(/export default |module\.exports +=/, '');
        // eslint-disable-next-line no-eval
        routesMap = eval('(function(){return ' + ctn + '})()');
    } catch (e) {}

    Object.keys(routesMap).forEach((key) => {
        routesMap[key] = _.normalizeRoute(key, routesMap[key]);
    });

    const routes = _.nestRoutes(_.mergeFlatRoutes(handledFlatRoutes, routesMap));
    const rootRoute = routes[0];
    if (options.rootPath !== undefined)
        rootRoute.path = options.rootPath;

    const outputs = [];
    outputs.push('export default ' + _.renderRoute(rootRoute));
    return outputs.join(';\n');
};
