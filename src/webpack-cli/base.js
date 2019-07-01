const path = require('path');
const merge = require('../lib/merge');
const webpack = require('webpack');
// const ExtractTextWebpackPlugin = require('extract-text-webpack-plugin');
const IconFontPlugin = require('icon-font-loader/src/Plugin');
// const CSSSpritePlugin = require('css-sprite-loader').Plugin;
const VueComponentAnalyzerPlugin = require('vue-component-analyzer/src/VueComponentAnalyzerPlugin');
const postcssImportResolver = require('postcss-import-resolver');

const importGlobalLoaderPath = require.resolve('../lib/loaders/import-global-loader');
const postcssVusionExtendMark = require('../lib/postcss/extend-mark');
const postcssVusionExtendMerge = require('../lib/postcss/extend-merge');

/**
 * params
 * api vue-cli
 * config vusion-config
 */
module.exports = (api, config) => {
    let resolveModules;
    if (config.resolvePriority === 'cwd')
        resolveModules = [
            path.resolve(process.cwd(), 'node_modules'),
            path.resolve(__dirname, '../node_modules'),
            path.resolve(__dirname, '../../'), 'node_modules'];
    else if (config.resolvePriority === 'current')
        resolveModules = [
            'node_modules',
            path.resolve(process.cwd(), 'node_modules'),
            path.resolve(__dirname, '../node_modules'),
            path.resolve(__dirname, '../../')];
    else
        resolveModules = [
            path.resolve(__dirname, '../node_modules'),
            path.resolve(__dirname, '../../'),
            'node_modules'];

    const postcssImportAlias = Object.assign({}, config.webpack.resolve ? config.webpack.resolve.alias : {});
    delete postcssImportAlias.EXTENDS;

    api.chainWebpack((webpackConfig) => {
        const postcssExtendMark = postcssVusionExtendMark({
            resolve: postcssImportResolver({
                extensions: ['.js'],
                alias: postcssImportAlias,
                modules: resolveModules,
            }),
        });

        // Postcss plugins
        const postcssPlugins = [
            postcssExtendMark,
            require('postcss-import')({
                resolve: postcssImportResolver({
                    alias: postcssImportAlias,
                    modules: resolveModules,
                }),
                skipDuplicates: false,
                plugins: [postcssExtendMark],
            }),
            require('postcss-url')({
                // Rewrite https://github.com/postcss/postcss-url/blob/master/src/type/rebase.js
                // 只需将相对路径变基，其它让 Webpack 处理即可
                url(asset, dir) {
                    if (asset.url[0] !== '.')
                        return asset.url;

                    let rebasedUrl = path.normalize(path.relative(dir.to, asset.absolutePath));
                    rebasedUrl = path.sep === '\\' ? rebasedUrl.replace(/\\/g, '/') : rebasedUrl;
                    rebasedUrl = `${rebasedUrl}${asset.search}${asset.hash}`;

                    if (asset.url.startsWith('..'))
                        return rebasedUrl;
                    else
                        return './' + rebasedUrl;
                },
            }),
            // precss removed
            require('postcss-variables'),
            require('postcss-preset-env')({
                stage: 0,
                browsers: config.browsers,
                features: {
                    'image-set-function': false, // handle by css-sprite-loader
                    'color-mod-function': true, // stage is -1, https://github.com/csstools/cssdb/blob/master/cssdb.json
                },
            }),
            // precss removed
            require('postcss-calc'),
            postcssVusionExtendMerge,
        ].concat(config.postcss);

        const vueOptions = merge({
            preserveWhitespace: false,
            postcss: postcssPlugins,
            cssModules: {
                importLoaders: process.env.NODE_ENV === 'production' ? 6 : 4,
                localIdentName: '[name]_[local]_[hash:base64:8]',
                minimize: process.env.NODE_ENV === 'production' && !!(config.uglifyJS || config.minifyJS),
            },
            cssSourceMap: config.sourceMap,
            extractCSS: process.env.NODE_ENV === 'production' && config.extractCSS,
            preLoaders: {
                css: importGlobalLoaderPath,
            },
            midLoaders: {
                css: process.env.NODE_ENV === 'production' ? ['css-sprite-loader', 'svg-classic-sprite-loader?filter=query', 'icon-font-loader'].join('!') : 'icon-font-loader',
            },
        }, config.vue);

        // CSS loaders options
        // const cssRule = [
        //     { loader: '@vusion/css-loader', options: Object.assign({
        //     // modules: true, // CSS Modules 是关闭的
        //         minimize: config.uglifyJS || config.minifyJS,
        //         sourceMap: config.sourceMap,
        //     }, vueOptions.cssModules) },
        //     'icon-font-loader',
        //     { loader: 'postcss-loader', options: { plugins: (loader) => postcssPlugins } },
        //     importGlobalLoaderPath,
        // ];
        // modules
        resolveModules.forEach((module) => {
            webpackConfig.resolve.modules.add(module);
            webpackConfig.resolveLoader.modules.add(module);
        });
        // alias
        webpackConfig.resolve.alias
            .set('vue$', path.resolve(process.cwd(), 'node_modules/vue/dist/vue.esm.js'))
            .set('globalCSS', config.globalCSSPath)
            .set('baseCSS', config.baseCSSPath)
            .set('library$', config.libraryPath)
            .set('@', config.srcPath)
            .set('@@', config.libraryPath)
            .set('~', process.cwd());
        // resolveLoaders
        webpackConfig.resolveLoader.alias
            .set('css-loader', '@vusion/css-loader')
            .set('vue-loader', '@vusion/vue-loader');

        webpackConfig.devtool('eval-source-map');
        webpackConfig.module
            .rule('vue')
            .test(/\.vue$/)
            .use('vue-loader')
            .loader('@vusion/vue-loader')
            .options(vueOptions);

        webpackConfig.module
            .rule('vue-multifile')
            .test(/\.vue[\\/]index\.js$/)
            .use('vue-multifile-loader')
            .loader('vue-multifile-loader')
            .options(vueOptions);

        webpackConfig.module.rule('css')
            .test(/\.css$/)
            .use('css-loader')
            .loader('@vusion/css-loader')
            .options(Object.assign({
                // modules: true, // CSS Modules 是关闭的
                minimize: config.uglifyJS || config.minifyJS,
                sourceMap: config.sourceMap,
            }, vueOptions.cssModules))
            .end()
            .use('icon-font')
            .loader('icon-font-loader')
            .end()
            .use('postcss')
            .loader('postcss-loader')
            .options({ plugins: (loader) => postcssPlugins });

        webpackConfig.module.rule('media')
            .test(/\.(png|jpg|gif|svg|eot|ttf|woff|woff2)$/)
            .use('file-loader')
            .loader('file-loader')
            .options({ name: '[name].[hash:16].[ext]' });

        // const iconfontOptions = Object.assign({
        //     fontName: config.name ? config.name + '-icon' : 'vusion-icon',
        //     filename: '[name].[hash:16].[ext]',
        //     mergeDuplicates: process.env.NODE_ENV === 'production',
        // }, config.options.IconFontPlugin);
        //
        // webpackConfig.plugin('icon-font-plugin')
        //     .use(IconFontPlugin, iconfontOptions);

        webpackConfig.plugin('vue-component-analyzer-plugin')
            .use(VueComponentAnalyzerPlugin);

        webpackConfig.stats({
            colors: true,
            modules: false,
            children: false,
            chunks: false,
            chunkModules: false,
        });

        if (config.lint) {
            webpackConfig.module
                .rule('js/vue')
                .test(/\.(js|vue)$/)
                .exclude(/node_modules/)
                .use('eslint-loader')
                .pre()
                .options({
                    eslintPath: path.resolve(process.cwd(), 'node_modules/eslint'),
                    formatter: require('eslint-friendly-formatter'),
                });
        }

        if (process.env.NODE_ENV === 'production' || config.babel) {

            // webpackConfig.module
            //     .rule('js').unshift({
            //     test: /\.js$/,
            //     exclude: (filepath) => {
            //         const babelIncludes = Array.isArray(config.babelIncludes) ? config.babelIncludes : [config.babelIncludes];
            //         const reincludes = [
            //             /\.(?:vue|vusion)[\\/].*\.js$/,
            //             /\.es6\.js$/,
            //         ].concat(babelIncludes);

            //         return filepath.includes('node_modules') && !reincludes.some((reinclude) => {
            //             if (typeof reinclude === 'string')
            //                 return filepath.includes(reinclude) || filepath.includes(reinclude.replace(/\//g, '\\'));
            //             else if (reinclude instanceof RegExp)
            //                 return reinclude.test(filepath);
            //             else if (typeof reinclude === 'function')
            //                 return reinclude(filepath);
            //             else
            //                 return false;
            //         });
            //     },
            //     loader: 'babel-loader',
            //     enforce: 'pre',
            // });
        }

        //  webpackConfig.plugins;
        console.log(webpackConfig);
        // webpackConfig.resolve.alias.add(module);
        // const webpackConfigResolved = api.resolveWebpackConfig();
        return webpackConfig;
    });
};
