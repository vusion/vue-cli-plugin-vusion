const fs = require('fs');
const path = require('path');
const chainCSS = require('../webpack/chainCSS');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const proxy = require('http-proxy-middleware');

module.exports = function chainDefault(api, vueConfig, vusionConfig) {
    if (vusionConfig.overwrite) {
        vueConfig.publicPath = vusionConfig.publicPath;
        vueConfig.outputDir = vusionConfig.outputPath;
    }

    api.chainWebpack((config) => {
        const mode = config.get('mode');

        // 添加 vue-cli-plugin-vusion context 下的模块路径，防止有些包找不到
        config.resolveLoader.modules.add(path.resolve(__dirname, '../node_modules'));

        // vue$, use default
        const alias = Object.assign({
            '@': vusionConfig.srcPath,
            '@@': vusionConfig.libraryPath,
            library: vusionConfig.libraryPath,
            '~': process.cwd(),
            globalCSS: vusionConfig.globalCSSPath,
            baseCSS: vusionConfig.baseCSSPath,
        }, vusionConfig.alias);

        /**
         * Default Mode
         */
        const resolveAlias = config.resolve.alias;
        Object.keys(alias).forEach((key) => resolveAlias.set(key, alias[key]));

        config.module.rule('vue-multifile')
            .test(/\.vue[\\/]index\.js$/)
            .use('cache-loader')
            .loader('cache-loader')
            .options(config.module.rule('vue').use('cache-loader').get('options'))
            .end()
            .use('vue-loader')
            .loader('vue-loader')
            .options(config.module.rule('vue').use('vue-loader').get('options'))
            .end()
            .use('vue-multifile-loader')
            .loader('vue-multifile-loader');

        config.module.rules.delete('postcss');
        config.module.rules.delete('scss');
        config.module.rules.delete('sass');
        config.module.rules.delete('less');
        config.module.rules.delete('stylus');

        chainCSS(config, vueConfig, vusionConfig);

        const staticPath = path.resolve(process.cwd(), vusionConfig.staticPath || './static');
        if (!fs.existsSync(staticPath))
            config.plugins.delete('copy');
        else {
            // 有的时候找不到原来的 CopyWebpackPlugin，不知道为什么
            config.plugin('copy').use(CopyWebpackPlugin, [
                [{ from: staticPath, to: vusionConfig.outputPath, ignore: ['.*'] }],
            ]);
        }

        /**
         * Raw Mode
         */
        if (vusionConfig.mode === 'raw')
            config.module.rules.delete('js');
    });

    // Hack for devServer options
    if (vueConfig.pluginOptions && vueConfig.pluginOptions.proxy) {
        const proxys = vueConfig.pluginOptions.proxy;
        api.configureDevServer((app) => {
            proxys.forEach((p) => {
                app.use(proxy(p.context, p));
            });
        });
    }
};
