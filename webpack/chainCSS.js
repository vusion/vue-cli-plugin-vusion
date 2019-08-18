const IconFontPlugin = require('icon-font-loader').Plugin;
const CSSSpritePlugin = require('css-sprite-loader').Plugin;
const importGlobalLoaderPath = require.resolve('./loaders/import-global-loader');
const postcssVariablesPath = require.resolve('./loaders/postcss-variables');

const getLocalIdent = require('./getLocalIdent');
const getPostcssPlugins = require('./getPostcssPlugins');

module.exports = function chainCSS(config, vueConfig, vusionConfig) {
    const mode = config.get('mode');
    const postcssPlugins = getPostcssPlugins(config, vueConfig, vusionConfig);

    function chainOneOf(oneOf, modules) {
        const cssOptions = {
            importLoaders: mode === 'production' ? 5 : 3,
            sourceMap: vueConfig.css.sourceMap,
        };

        if (vusionConfig.mode === 'raw')
            cssOptions.importLoaders = 2;

        const cssModuleOptions = Object.assign({
            modules: true,
            getLocalIdent,
            localIdentName: '[name]_[local]_[hash:base64:8]',
        }, cssOptions);

        oneOf.use('css-loader')
            .options(modules ? cssModuleOptions : cssOptions)
            .end();

        if (vusionConfig.mode !== 'raw') {
            mode === 'production' && oneOf.use('css-sprite-loader')
                .loader('css-sprite-loader')
                .end()
                .use('svg-classic-sprite-loader')
                .loader('svg-classic-sprite-loader')
                .options({ filter: 'query' })
                .end();

            oneOf.use('icon-font-loader')
                .loader('icon-font-loader')
                .end();
        }

        oneOf.use('postcss-loader')
            .loader('postcss-loader')
            .options({ plugins: () => postcssPlugins })
            .end()
            .use('import-global-loader')
            .loader(importGlobalLoaderPath)
            .options({
                globalCSSPath: vusionConfig.globalCSSPath,
                theme: vusionConfig.theme,
            });
    }

    const ruleCSS = config.module.rule('css');
    chainOneOf(ruleCSS.oneOf('vue-modules'), true);
    chainOneOf(ruleCSS.oneOf('vue'), false);
    chainOneOf(ruleCSS.oneOf('normal-modules'), true);
    chainOneOf(ruleCSS.oneOf('normal'), false);

    ruleCSS.oneOf('variables')
        .resourceQuery(/variables/)
        .use('postcss-variables')
        .loader(postcssVariablesPath)
        .end()
        .use('postcss-loader')
        .loader('postcss-loader')
        .options({ plugins: () => postcssPlugins })
        .end();

    if (vusionConfig.mode !== 'raw') {
        config.plugin('icon-font-plugin')
            .use(IconFontPlugin, [{
                fontName: vusionConfig.name ? vusionConfig.name + '-icon' : 'vusion-icon',
                filename: '[name].[hash:16].[ext]',
                output: './fonts',
                mergeDuplicates: mode === 'production',
            }]);

        mode === 'production' && config.plugin('css-sprite-plugin')
            .use(CSSSpritePlugin, [{
                imageSetFallback: true,
                plugins: postcssPlugins,
            }]);
    }
};
