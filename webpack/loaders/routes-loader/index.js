const fs = require('fs');
const path = require('path');
const loaderUtils = require('loader-utils');
const JS = require('javascript-stringify');

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

// 生成routes，通过字符串拼接的形式
module.exports = function (content) {
    const options = loaderUtils.getOptions(this);
    options.rootPath = options.rootPath || options.name;
    options.chunkName = options.chunkName || options.name;

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

        key = key.replace(/\/views\//, '/').replace(/\$/, ':');
        route.path = route.path.replace(/\/views\//, '/').replace(/\$/, ':');
        route.filePath = './' + path.join('views', route.filePath);
        route.chunkName = options && options.chunkName;

        handledFlatRoutes[key] = route;

        return route;
    });

    let routesMap = {};
    try {
        const ctn = content.trim().replace(/export default |module\.exports +=/, '');
        // eslint-disable-next-line no-eval
        routesMap = eval('(function(){return ' + ctn + '})()');
    } catch (e) {}

    const routes = _.nestRoutes(_.mergeFlatRoutes(handledFlatRoutes, routesMap));
    const rootRoute = routes[0];
    if (options.rootPath !== undefined)
        rootRoute.path = options.rootPath;

    const outputs = [];
    outputs.push('export default ' + _.renderRoute(rootRoute));
    return outputs.join(';\n');
};
