const fs = require('fs');
const path = require('path');
const loaderUtils = require('loader-utils');

const _ = require('./utils');

// 生成routes，通过字符串拼接的形式
module.exports = function (content) {
    const config = loaderUtils.getOptions(this);
    const resourceDir = path.dirname(this.resourcePath);

    // 动态生成路由
    const viewsPath = path.resolve(resourceDir, 'views');
    this.addContextDependency(viewsPath);
    const flatRoutes = _.getFlatRoutes(viewsPath);
    const handledFlatRoutes = {};
    Object.keys(flatRoutes).map((key) => {
        const route = flatRoutes[key];

        key = key.replace(/\/views\//, '/').replace(/\/\$/, '/:');
        route.path = key;
        handledFlatRoutes[key] = route;

        return route;
    });

    let routesMap = {};
    try {
        routesMap = JSON.parse(content);
    } catch (e) {}

    const routes = _.nestRoutes(_.mergeFlatRoutes(handledFlatRoutes, routesMap));

    const outputs = [];
    outputs.push('export default ' + _.renderRoutes(routes));
    return outputs.join(';\n');
};
