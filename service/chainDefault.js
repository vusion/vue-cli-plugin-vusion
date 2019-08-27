const fs = require('fs');
const path = require('path');
const chainCSS = require('../webpack/chainCSS');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const proxy = require('http-proxy-middleware');

module.exports = function chainDefault(api, vueConfig, vusionConfig) {
    if (vusionConfig.publicPath)
        vueConfig.publicPath = vusionConfig.publicPath;
    // if (vusionConfig.outputPath)
    //     vueConfig.outputDir = vusionConfig.outputPath; // outputPath与outputDir冲突
    if (vusionConfig.webpack && vusionConfig.webpack.output) {
        vueConfig.outputDir = vusionConfig.webpack.output.path;
        vueConfig.publicPath = vusionConfig.webpack.output.publicPath;
        delete vusionConfig.webpack.output.path;
        delete vusionConfig.webpack.output.publicPath;
    }

    api.chainWebpack((config) => {
        // const mode = config.get('mode');
        config.resolveLoader.modules.add(path.resolve(__dirname, '../node_modules/'));
        config.entryPoints.clear();
        /**
         * Default Mode
         */
        config.resolve.alias
        // vue$, use default
            .set('@', vusionConfig.srcPath)
            .set('@@', vusionConfig.libraryPath)
            .set('library', vusionConfig.libraryPath)
            .set('~', process.cwd())
            .set('globalCSS', vusionConfig.globalCSSPath)
            .set('baseCSS', vusionConfig.baseCSSPath);

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
        if (!vueConfig.pluginOptions.postcssReGen)
            chainCSS(config, vueConfig, vusionConfig);

        const staticPath = path.resolve(process.cwd(), vusionConfig.staticPath || './static');
        if (!fs.existsSync(staticPath))
            config.plugins.delete('copy');
        else {
            config.plugin('copy').use(CopyWebpackPlugin, [
                [{ from: staticPath, to: vueConfig.outputDir, ignore: ['.*'] }],
            ]);
        }

        /**
         * Raw Mode
         */
        if (vusionConfig.mode === 'raw')
            config.module.rules.delete('js');
    });
    api.configureWebpack(() =>
        vusionConfig.webpack);

    if (vueConfig.pluginOptions.proxy) {
        const proxys = vueConfig.pluginOptions.proxy;
        api.configureDevServer((app) => {
            proxys.forEach((p) => {
                // console.log(p);
                app.use(proxy(p.context, p));
            });
        });
    }
    // 仅为调试
    // const config = api.resolveWebpackConfig();
    // console.log(config);
};
