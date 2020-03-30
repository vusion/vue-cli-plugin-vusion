const IconFontPlugin = require('icon-font-loader').Plugin;
const CSSSpritePlugin = require('css-sprite-loader').Plugin;
const importGlobalLoaderPath = require.resolve('./loaders/import-global-loader');
const moduleClassPriorityLoaderPath = require.resolve('./loaders/module-class-priority-loader');
const postcssVariablesPath = require.resolve('./loaders/postcss-variables');

const getLocalIdent = require('./getLocalIdent');
const getPostcssPlugins = require('./getPostcssPlugins');
const chainCSSOneOfs = require('./chainCSSOneOfs');

const semver = require('semver');
const isNewCSSLoader = semver.satisfies(require('css-loader/package.json').version, '>=3.0.0');

module.exports = function chainCSS(config, vueConfig, vusionConfig) {
    const mode = config.get('mode');
    const postcssPlugins = getPostcssPlugins(config, vueConfig, vusionConfig);

    chainCSSOneOfs(config, (oneOf, modules) => {
        const cssOptions = {
            importLoaders: mode === 'production' ? 5 : 3,
            sourceMap: vueConfig.css.sourceMap,
        };

        if (vusionConfig.mode === 'raw')
            cssOptions.importLoaders = 2;
        if (vusionConfig.applyTheme)
            cssOptions.importLoaders++;

        const cssOptionsModules = {
            getLocalIdent,
            localIdentName: '[name]_[local]_[hash:base64:8]',
        };

        if (modules) {
            if (isNewCSSLoader) {
                cssOptions.modules = cssOptionsModules;
            } else {
                cssOptions.modules = true;
                Object.assign(cssOptions, cssOptionsModules);
            }
        }

        oneOf.use('css-loader')
            .options(cssOptions)
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

        const postcssLoader = oneOf.use('postcss-loader')
            .loader('postcss-loader')
            .options({ plugins: () => postcssPlugins })
            .end()
            .use('module-class-priority-loader')
            .loader(moduleClassPriorityLoaderPath)
            .end();

        if (vusionConfig.applyTheme) {
            postcssLoader.use('import-global-loader')
                .loader(importGlobalLoaderPath)
                .options({
                    theme: vusionConfig.theme,
                })
                .end();
        }
    });

    // @TODO: 需要支持 var(--xxx)
    config.module.rule('css').oneOf('variables')
        .resourceQuery(/variables/)
        .use('postcss-variables')
        .loader(postcssVariablesPath)
        .end()
        .use('postcss-loader')
        .loader('postcss-loader')
        .options({ plugins: () => postcssPlugins })
        .end()
        .__before = 'normal';

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

    // 为了处理二次打包，添加两次 hash 的情况
    if (vusionConfig.mode === 'raw') {
        config.module.rule('images').use('url-loader').tap((options) => {
            options.fallback.options.name = 'img/[hash:8]/[name].[ext]';
            return options;
        });
        config.module.rule('svg').use('file-loader').tap((options) => {
            options.name = 'img/[hash:8]/[name].[ext]';
            return options;
        });
        config.module.rule('media').use('url-loader').tap((options) => {
            options.fallback.options.name = 'media/[hash:8]/[name].[ext]';
            return options;
        });
        config.module.rule('fonts').use('url-loader').tap((options) => {
            options.fallback.options.name = 'fonts/[hash:8]/[name].[ext]';
            return options;
        });
    }
};
