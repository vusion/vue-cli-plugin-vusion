const fs = require('fs');
const path = require('path');
const vusion = require('vusion-api');
const loaderUtils = require('loader-utils');

const defaults = require('./defaults');
const _ = require('../../common/utils');

// 生成routes，通过字符串拼接的形式
module.exports = function (content) {
    const config = loaderUtils.getOptions(this);
    // 用于实时更新 docs 文档缓存
    config.docs = vusion.config.resolve(process.cwd()).docs;

    const srcPath = config.srcPath;
    const libraryPath = config.libraryPath;

    this.cacheable();
    // 动态监听目录中组件的增加
    // this.addContextDependency(srcPath || libraryPath);
    this.addDependency(config.configPath);
    this.addDependency(config.packagePath);

    // 动态生成路由
    const docLoaderViewsPath = path.resolve(__dirname, '../views');
    this.addContextDependency(docLoaderViewsPath);
    const flatRoutesList = [_.getFlatRoutes(docLoaderViewsPath)];
    const cwdViewsPath = path.resolve(process.cwd(), 'docs/views');
    if (fs.existsSync(cwdViewsPath)) {
        this.addContextDependency(cwdViewsPath);
        flatRoutesList.push(_.getFlatRoutes(cwdViewsPath));
    }
    if (config.docs && config.docs.routes)
        flatRoutesList.push(config.docs.routes);

    const routes = _.nestRoutes(_.mergeFlatRoutes(...flatRoutesList));

    let components; let vendors; let blocks; let directives; let filters; let utils; let misc; let layouts;
    if (config.type === 'component' || config.type === 'block') {
        components = _.getMaterial(srcPath, 'components');
        flatRoutesList[0]['/components'] && _.setChildren(flatRoutesList[0]['/components'], components);
    } else {
        // 动态生成组件、区块、指令、过滤器、工具
        // @compat:
        let componentsPath = path.join(libraryPath, 'components');
        components = _.getMaterials(componentsPath, config.docs && config.docs.components, 'components');
        let componentsPath2 = path.join(libraryPath, '../src');
        const components2 = _.getMaterials(componentsPath2, config.docs && config.docs.components, 'components');
        // components.push(...components2);
        flatRoutesList[0]['/components'] && _.setChildren(flatRoutesList[0]['/components'], [].concat(components, components2));
        components.forEach((component) => {
            // 监听 docs 目录的变更
            if (component.path && component.path.endsWith('api.yaml'))
                this.addContextDependency(path.join(component.path, '../docs'));
        });

        const blocksPath = path.join(srcPath, 'blocks');
        if (fs.existsSync(blocksPath)) {
            blocks = _.getMaterials(blocksPath, config.docs && config.docs.blocks, 'blocks');
            flatRoutesList[0]['/blocks'] && _.setChildren(flatRoutesList[0]['/blocks'], blocks);
        }

        const vendorsPath = path.resolve(process.cwd(), 'packages');
        if (fs.existsSync(vendorsPath)) {
            vendors = _.getMaterials(vendorsPath, config.docs && config.docs.vendors, 'vendors');
            flatRoutesList[0]['/vendors'] && _.setChildren(flatRoutesList[0]['/vendors'], vendors);
        }

        const directivesPath = path.join(srcPath, 'directives');
        directives = _.getMaterials(directivesPath, config.docs && config.docs.directives, 'directives');
        const filtersPath = path.join(srcPath, 'filters');
        filters = _.getMaterials(filtersPath, config.docs && config.docs.filters, 'filters');
        const utilsPath = path.join(srcPath, 'utils');
        utils = _.getMaterials(utilsPath, config.docs && config.docs.utils, 'utils');

        misc = [].concat(directives, filters, utils);
        flatRoutesList[0]['/misc'] && _.setChildren(flatRoutesList[0]['/misc'], misc);

        const layoutsPath = path.join(libraryPath, 'layouts');
        layouts = _.getMaterials(layoutsPath, config.docs && config.docs.layouts, 'layouts');
        flatRoutesList[0]['/layouts'] && _.setChildren(flatRoutesList[0]['/layouts'], layouts);
    }

    const outputs = [];
    const $docs = Object.assign({}, defaults, config.docs, {
        componentsGroups: components && _.groupMaterials(components),
        vendorsGroups: vendors && _.groupMaterials(vendors),
        blocksGroups: blocks && _.groupMaterials(blocks),
        miscGroups: misc && _.groupMaterials(misc),
        layoutsGroups: layouts && _.groupMaterials(layouts),
        package: require(config.packagePath),
    });

    // 只能在 dev 时添加主题参数，在 build 时会出现多次打包不一样的情况
    if (process.env.NODE_ENV === 'development')
        $docs.theme = config.theme;

    outputs.push('const $docs = ' + JSON.stringify($docs));
    outputs.push('$docs.routes = ' + _.renderRoutes(routes));
    outputs.push('export default $docs');
    return outputs.join(';\n');
};
