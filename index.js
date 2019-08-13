const path = require('path');
const vusion = require('vusion-api');

const chainCSS = require('./webpack/chainCSS');

module.exports = function (api, vueConfig) {
    const vusionConfig = vusion.config.resolve(process.cwd());

    api.chainWebpack((config) => {
        const mode = config.get('mode');

        config.resolve.alias
        // vue$, use default
            .set('@', vusionConfig.srcPath)
            .set('@@', vusionConfig.libraryPath)
            .set('~', process.cwd())
            .set('globalCSS', vusionConfig.globalCSSPath)
            .set('baseCSS', vusionConfig.baseCSSPath);

        config.module.rule('vue-multifile-loader')
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

        config.plugin('copy').tap((args) => {
            args[0][0].from = path.resolve(process.cwd(), vusionConfig.staticPath || './static');
            return args;
        });
    });

    // console.log(options);
};
