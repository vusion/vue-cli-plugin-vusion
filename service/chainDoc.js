const fs = require('fs');
const path = require('path');
const webpack = require('webpack');
const HTMLPlugin = require('html-webpack-plugin');
const autoLoaderPath = require.resolve('@vusion/doc-loader/lib/auto-loader');
const entryLoaderPath = require.resolve('@vusion/doc-loader/lib/entry-loader');
const MiniCSSExtractPlugin = require('@vusion/mini-css-extract-plugin');
const chainCSSOneOfs = require('../webpack/chainCSSOneOfs');

// markdown-it
const iterator = require('markdown-it-for-inline');
const uslug = require('uslug');
const uslugify = (s) => uslug(s);

module.exports = function chainDoc(api, vueConfig, vusionConfig) {
    vueConfig.publicPath = vusionConfig.docs && vusionConfig.docs.base ? vusionConfig.docs.base : '';
    vueConfig.outputDir = 'public';
    vueConfig.runtimeCompiler = true;
    vueConfig.productionSourceMap = false;

    api.chainWebpack((config) => {
        config.entryPoints.clear();
        config.entry('docs')
            .add(require.resolve('@vusion/doc-loader/views/index.js'));

        // Make sure vue & vue-router unique
        config.resolve.alias
            .set('vue$', require.resolve('vue/dist/vue.esm.js'))
            .set('vue-router$', require.resolve('vue-router/dist/vue-router.esm.js'));
        const isVuePackage = vusionConfig.type === 'component' || vusionConfig.type === 'block';
        config.resolve.alias
            .set('proto-ui', isVuePackage ? 'proto-ui.vusion/dist' : 'proto-ui.vusion');

        config.module.rule('doc-config')
            .test(/@vusion[\\/]doc-loader[\\/]views[\\/]empty\.js$/)
            .use('auto-loader')
            .loader(autoLoaderPath)
            .options(vusionConfig);

        const docsPath = path.resolve(process.cwd(), 'docs');
        const docsComponentsPath = path.resolve(docsPath, 'components');
        const docsViewsPath = path.resolve(docsPath, 'views');
        const docsImportsPath = path.resolve(docsPath, 'imports.js');

        const defineOptions = {
            type: vusionConfig.type,
            DOCS_PATH: fs.existsSync(docsPath) ? JSON.stringify(docsPath) : undefined,
            DOCS_COMPONENTS_PATH: fs.existsSync(docsComponentsPath) ? JSON.stringify(docsComponentsPath) : undefined,
            DOCS_VIEWS_PATH: fs.existsSync(docsViewsPath) ? JSON.stringify(docsViewsPath) : undefined,
            DOCS_IMPORTS_PATH: fs.existsSync(docsImportsPath) ? JSON.stringify(docsImportsPath) : undefined,
        };

        config.module.rule('doc-entry')
            .test(/@vusion[\\/]doc-loader[\\/]views[\\/]index\.js$/)
            .use('entry-loader')
            .loader(entryLoaderPath)
            .options(defineOptions);

        // 很多 loader 与 Plugin 有结合，所以 thread-loader 不能开启
        config.module.rule('js').uses.delete('thread-loader');

        // Eslint 需要删除 @vue/cli-plugin-eslint
        config.module.rule('markdown')
            .test(/\.md$/)
            // cache-loader 老报错，干脆关了！
            // .use('cache-loader')
            // .loader('cache-loader')
            // .options(config.module.rule('vue').use('cache-loader').get('options'))
            // .end()
            .use('vue-loader')
            .loader('vue-loader')
            .options(config.module.rule('vue').use('vue-loader').get('options'))
            .end()
            .use('@vusion/md-vue-loader')
            .loader('@vusion/md-vue-loader')
            .options({
                wrapper: 'u-article',
                plugins: [
                    require('markdown-it-ins'),
                    require('markdown-it-mark'),
                    require('markdown-it-abbr'),
                    require('markdown-it-deflist'),
                    [require('markdown-it-anchor'), {
                        slugify: uslugify,
                        permalink: true,
                        permalinkClass: 'heading-anchor',
                        permalinkSymbol: '#',
                    }],
                    // require('markdown-it-container'),
                    [iterator, 'link_converter', 'link_open', (tokens, idx) => tokens[idx].tag = 'u-link'],
                    [iterator, 'link_converter', 'link_close', (tokens, idx) => tokens[idx].tag = 'u-link'],
                ],
                showCodeLineCount: 5,
                codeProcess(live, code, content, lang) {
                    const relativePath = path.relative(process.cwd(), this.loader.resourcePath).replace(/\\/g, '/').replace(/^(\.\.\/)+/, '');

                    if (live) {
                        const lineCount = content.split('\n').length;
                        return `<u-code-example
:show-code="${lineCount <= this.options.showCodeLineCount}"
:show-detail="${lang === 'vue'}"
file-path="${relativePath}">
<div>${live}</div>
<div slot="code">${code}</div>
</u-code-example>\n\n`;
                    } else
                        return code;
                },
            });

        // 嫌麻烦，先关了！
        config.optimization.splitChunks({
            cacheGroups: {
                vendors: false,
                default: false,
            },
        });

        if (!Object.keys(vusionConfig.theme).length <= 1) {
            config.plugin('html')
                .use(HTMLPlugin, [{
                    filename: 'index.html',
                    template: path.resolve(require.resolve('@vusion/doc-loader/views/index.js'), '../index.html'),
                    chunks: 'all',
                    hash: true,
                }]);
            // For history mode 404 on GitHub
            config.plugin('html-404')
                .use(HTMLPlugin, [{
                    filename: '404.html',
                    template: path.resolve(require.resolve('@vusion/doc-loader/views/index.js'), '../index.html'),
                    chunks: 'all',
                    hash: true,
                }]);
        } else {
            config.plugin('html')
                .use(HTMLPlugin, [{
                    filename: 'index.html',
                    template: path.resolve(require.resolve('@vusion/doc-loader/views/index.js'), '../theme.html'),
                    chunks: 'all',
                    inject: false,
                }]);
            config.plugin('html-404')
                .use(HTMLPlugin, [{
                    filename: '404.html',
                    template: path.resolve(require.resolve('@vusion/doc-loader/views/index.js'), '../theme.html'),
                    chunks: 'all',
                    inject: false,
                }]);
        }

        if (config.plugins.has('extract-css')) { // Build mode
            chainCSSOneOfs(config, (oneOf, modules) => {
                oneOf.use('extract-css-loader')
                    .loader(MiniCSSExtractPlugin.loader)
                    .options({
                        rules: {
                            publicPath: '../',
                            hmr: false,
                        },
                    });
            });
            config.plugin('extract-css').use(MiniCSSExtractPlugin, [{
                filename: 'css/[name].css',
                themeFilename: 'css/[name]-theme-[theme].css',
                themes: Object.keys(vusionConfig.theme),
            }]);
        }

        config.plugin('define-docs')
            .use(webpack.DefinePlugin, [defineOptions]);
    });
};
