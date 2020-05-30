const fs = require('fs');
const path = require('path');
const loaderUtils = require('loader-utils');

const _ = require('../../../webpack/loaders/routes-loader/utils');

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
    const config = loaderUtils.getOptions(this);
    this.cacheable();
    // 动态监听目录变化，成本太高，最好是能够只监听到目录的变动
    // this.addContextDependency(srcPath || libraryPath);
    // @TODO: 动态监听配置变化
    this.addDependency(config.packagePath);

    const resourceDir = path.dirname(this.resourcePath);

    // 动态生成路由
    const srcPath = config.srcPath;
    const viewsPath = path.resolve(srcPath, 'views');
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
        route.filePath = './' + path.relative(resourceDir, path.join(viewsPath, route.filePath));
        // route.chunkName = options.chunkName;

        handledFlatRoutes[key] = route;

        return route;
    });
    if (!handledFlatRoutes[''])
        _.createRoute('', handledFlatRoutes, true);

    const routes = Object.keys(flatRoutes).map((key) => {
        const route = flatRoutes[key];
        route.path = key.replace(/\/views(\/|$)/, '$1').replace(/^\/?/, '/');
        return route;
    });

    const outputs = [];

    const $designer = {};

    outputs.push('const $designer = ' + JSON.stringify($designer));
    outputs.push('$designer.routes = ' + _.renderRoutes(routes));
    outputs.push('export default $designer');
    return outputs.join(';\n');
};
