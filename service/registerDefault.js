const fs = require('fs');
const path = require('path');
const chainCSS = require('../webpack/chainCSS');

module.exports = function registerDefault(api, vueConfig, vusionConfig) {
    api.chainWebpack((config) => {
        const mode = config.get('mode');

        config.resolve.alias
        // vue$, use default
            .set('@', vusionConfig.srcPath)
            .set('@@', vusionConfig.libraryPath)
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

        chainCSS(config, vueConfig, vusionConfig);

        const staticPath = path.resolve(process.cwd(), vusionConfig.staticPath || './static');
        if (!fs.existsSync(staticPath))
            config.plugin('copy').delete();
        else {
            config.plugin('copy').tap((args) => {
                args[0][0].from = staticPath;
                return args;
            });
        }
    });
};
