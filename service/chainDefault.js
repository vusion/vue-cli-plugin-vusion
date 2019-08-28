const fs = require('fs');
const path = require('path');
const chainCSS = require('../webpack/chainCSS');
const CopyWebpackPlugin = require('copy-webpack-plugin');
// const proxy = require('http-proxy-middleware');

module.exports = function chainDefault(api, vueConfig, vusionConfig) {
    vueConfig.publicPath = vusionConfig.publicPath;
    vueConfig.outputDir = vusionConfig.outputPath;

    api.chainWebpack((config) => {
        const mode = config.get('mode');

        // 添加 vue-cli-plugin-vusion context 下的模块路径，防止有些包找不到
        config.resolveLoader.modules.add(path.resolve(__dirname, '../node_modules'));

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

        // @review
        // if (!vueConfig.pluginOptions.postcssReGen)
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

    // @review
    // api.configureWebpack(() =>
    //     vusionConfig.webpack);

    // if (vueConfig.pluginOptions.proxy) {
    //     const proxys = vueConfig.pluginOptions.proxy;
    //     api.configureDevServer((app) => {
    //         proxys.forEach((p) => {
    //             // console.log(p);
    //             app.use(proxy(p.context, p));
    //         });
    //     });
    // }
    // 仅为调试
    // const config = api.resolveWebpackConfig();
    // console.log(config);
};
