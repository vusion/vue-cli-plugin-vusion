const fs = require('fs');
const path = require('path');
const loaderUtils = require('loader-utils');

const _ = require('../common/utils');

// 生成routes，通过字符串拼接的形式
module.exports = function (content) {
    const config = loaderUtils.getOptions(this);
    this.cacheable();
    // 动态监听目录变化，成本太高，最好是能够只监听到目录的变动
    // this.addContextDependency(srcPath || libraryPath);
    // @TODO: 动态监听配置变化
    this.addDependency(config.packagePath);

    // 动态生成路由
    const srcPath = config.srcPath;
    const srcViewsPath = path.resolve(srcPath, 'views');
    // this.addContextDependency(srcViewsPath);
    const flatRoutes = _.getFlatRoutes(srcViewsPath);
    const routes = Object.keys(flatRoutes).map((key) => {
        const route = flatRoutes[key];
        route.path = key.replace(/\/views\//, '/');
        return route;
    });

    const outputs = [];

    const $designer = {};

    outputs.push('const $designer = ' + JSON.stringify($designer));
    outputs.push('$designer.routes = ' + _.renderRoutes(routes));
    outputs.push('export default $designer');
    return outputs.join(';\n');
};
