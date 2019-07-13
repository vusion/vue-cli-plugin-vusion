/**
 * BASE webpack config
 * migrate from v14
 * vue-loader vue-template-compiler VueLoaderPlugin
 *
 * warning: Vue Loader no longer auto applies PostCSS transforms.
 *          To use PostCSS, configure postcss-loader the same way you would for normal CSS files.
 *
 * the following options is deprecated!
       loader
       preLoaders
       postLoaders
       postcss
       cssSourceMap
       buble
       extractCSS
       template
 *
   the following options is deprecated and  should be configured using the new compilerOptions option:
       preserveWhitespace (use compilerOptions.preserveWhitespace)
       compilerModules (use compilerOptions.modules)
       compilerDirectives (use compilerOptions.directives)

The following option has been renamed:
       transformToRequire (now renamed to transformAssetUrls)
 */
const path = require('path');
// const webpackChainConfig = require('webpack-chain');
const moduleResolverFac = require('./module-resolver/index');
const postcssPluginsFac = require('./postcss/plugins');
const importGlobalLoaderPath = require.resolve('./postcss/import-global-loader.js');
const vuemultifilePath = require.resolve('vue-multifile-loader');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
// 此插件暂时先不配，配上去会报错
const VueComponentAnalyzerPlugin = require('vue-component-analyzer/src/VueComponentAnalyzerPlugin');
const IconFontPlugin = require('icon-font-loader/src/Plugin');
const VueLoaderPlugin = require('vue-loader/lib/plugin');

// webpackChain
module.exports = function (webpackChain, vusionConfig, webpackConfig) {
    const resolveModules = moduleResolverFac(vusionConfig);

    resolveModules.forEach((module) => {
        webpackChain.resolve.modules.add(module);
        webpackChain.resolveLoader.modules.add(module);
    });

    // alias
    webpackChain.resolve.alias
        .set('vue$', path.resolve(process.cwd(), 'node_modules/vue/dist/vue.esm.js'))
        .set('globalCSS', vusionConfig.globalCSSPath)
        .set('baseCSS', vusionConfig.baseCSSPath)
        .set('library$', vusionConfig.libraryPath)
        .set('@', vusionConfig.srcPath)
        .set('@@', vusionConfig.libraryPath)
        .set('~', process.cwd());

    // devtool
    webpackChain.devtool('eval-source-map');

    /**
     * modules
     * module: {
     *  rules: [
     *      {
     *          test: /\.vue[\\/]index\.js$/,
     *          use: [
                    'vue-loader',
                    'vue-multifile-loader'
                ],
     *      },
     *      {
     *          test: /\.vue$/,
     *          use: [
                    'vue-loader',
                ],
     *      },
     *      {
     *          test: /\.css$/,
     *          oneOf: [
     *              {
     *                  resourceQuery: /module/,
     *                  use: [
     *                      process.env.NODE_ENV !== 'production' && vusionConfig.extractCSS ? 'mini-css-extract-loader':'vue-style-loader' : ,
                            'css-loader' ( module : true),
                            'icon-font-loader',
                            'postcss-loader',
                            'import-global-loader' // 此处修改了获取配置的方式，通过options
                        ],
     *              },
     *              {
     *                  use: [
     *                      process.env.NODE_ENV !== 'production' && vusionConfig.extractCSS ? 'mini-css-extract-loader':'vue-style-loader' : ,
                            'css-loader' ( module : false),
                            'icon-font-loader',
                            'postcss-loader',
                            'import-global-loader' // 此处修改了获取配置的方式，通过options
                        ],
     *              }
     *          ]
     *      },
     *      {
     *          test: /\.(png|jpg|gif|svg|eot|ttf|woff|woff2)$/,
     *          use: 'file-loader'
     *      }
     *  ]
     * }
     *  */
    webpackChain.module
        .rule('vue')
        .test(/\.vue$/)
        .use('vue-loader')
        .loader('vue-loader', [{
            compilerOptions: {
                preserveWhitespace: false,
            },
        }]);
    webpackChain.module
        .rule('vue-folder')
        .test(/\.vue[\\/]index\.js$/)
        .use('vue-loader')
        .loader('vue-loader')
        .end()
        .use('vue-multifile-loader')
        .loader(vuemultifilePath);

    const postcssPlugins = postcssPluginsFac(vusionConfig, webpackConfig, resolveModules);
    const cssModuleOption = {
        importLoaders: process.env.NODE_ENV === 'production' ? 6 : 4,
        localIdentName: '[name]_[local]_[hash:base64:8]',
        minimize: process.env.NODE_ENV === 'production' && !!(vusionConfig.uglifyJS || vusionConfig.minifyJS),
        sourceMap: vusionConfig.sourceMap,
    };

    function cssRuleChain(ruleChain, type, query, cssModuleOptions) {
        /* eslint-disable */

        const rules = ruleChain.oneOf(type)

        if(query)
            rules.resourceQuery(query);

        rules.when(process.env.NODE_ENV !== 'production' && vusionConfig.extractCSS,
            config => { config.use('vue-style-loader').loader('vue-style-loader'); },
            config => { config.use('mini-css-extract').loader(MiniCssExtractPlugin.loader); })

        rules.use('css-loader')
             .loader('css-loader')
             .options(cssModuleOptions)
             .end()
          .use('icon-font-loader')
              .loader('icon-font-loader')
              .end()
          .use('postcss-loader')
             .loader('postcss-loader')
             .options({ plugins: () => postcssPlugins })
             .end()
          .use('import-global-loader')
             .loader(importGlobalLoaderPath)
             .options({
                 vusionConfig
             })
        /* eslint-enable */
    }

    const cssRoot = webpackChain.module.rule('css').test(/\.css$/);

    cssRuleChain(cssRoot, 'module', /module/,
        Object.assign({
            modules: true,
        }, cssModuleOption));
    cssRuleChain(cssRoot, 'normal', '', cssModuleOption);

    webpackChain.module.rule('media')
        .test(/\.(png|jpg|gif|svg|eot|ttf|woff|woff2)$/)
        .use('file-loader')
        .loader('file-loader')
        .options({ name: '[name].[hash:16].[ext]' });

    if (process.env.NODE_ENV === 'production' || vusionConfig.babel) {
        // 存在 dynamic-import error
        webpackChain.module
            .rule('js')
            .test(/\.jsx?$/)
            .exclude
            .add((filepath) => {
                const babelIncludes = Array.isArray(vusionConfig.babelIncludes) ? vusionConfig.babelIncludes : [vusionConfig.babelIncludes];
                const reincludes = [
                    /\.(?:vue|vusion)[\\/].*\.js$/,
                    /\.es6\.js$/,
                ].concat(babelIncludes);

                const r = filepath.includes('node_modules') && !reincludes.some((reinclude) => {
                    if (typeof reinclude === 'string')
                        return filepath.includes(reinclude) || filepath.includes(reinclude.replace(/\//g, '\\'));
                    else if (reinclude instanceof RegExp)
                        return reinclude.test(filepath);
                    else if (typeof reinclude === 'function')
                        return reinclude(filepath);
                    else
                        return false;
                });
                    // if (!r)
                    //     console.log(filepath, r);
                return r;
            }).end()
            .use('babel') // no pre rule
            .loader('babel-loader').end();
    }

    if (vusionConfig.lint) {
        // 还没测试过
        webpackChain.module
            .rule('eslint')
            .test(/\.(js|vue)$/)
            .exclude
            .add((filepath) =>
            // Don't transpile node_modules
                /node_modules/.test(filepath))
            .use('eslint')
            .loader('eslint-loader')
            .options({
                eslintPath: path.resolve(process.cwd(), 'node_modules/eslint'),
                formatter: require('eslint-friendly-formatter'),
            });
    }

    const iconfontOptions = Object.assign({
        fontName: vusionConfig.name ? vusionConfig.name + '-icon' : 'vusion-icon',
        filename: '[name].[hash:16].[ext]',
        mergeDuplicates: process.env.NODE_ENV === 'production',
    }, vusionConfig.options.IconFontPlugin);

    /**
     * plugins:
     * plugins: [
            new VueLoaderPlugin(),
            new IconFontPlugin(iconfontOptions),
            process.env.NODE_ENV !== 'production' && vusionConfig.extractCSS && new MiniCssExtractPlugin()
        ],
     */
    webpackChain.plugin('vue-loader-plugin')
        .use(VueLoaderPlugin);
    webpackChain.plugin('icon-font-plugin')
        .use(IconFontPlugin, [iconfontOptions]);
    // webpackChain.plugin('vue-component-analyzer-plugin')
    //     .use(VueComponentAnalyzerPlugin);

    if (process.env.NODE_ENV !== 'production' && vusionConfig.extractCSS) {
        webpackChain.plugin('mini-css-extract')
            .use(MiniCssExtractPlugin);
    }

    // stats
    webpackChain.stats({
        colors: true,
        modules: false,
        children: false,
        chunks: false,
        chunkModules: false,
    });

    return webpackChain;
};
