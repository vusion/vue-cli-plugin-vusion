const fs = require('fs');
const path = require('path');
const webpack = require('webpack');
const iterator = require('markdown-it-for-inline');
const autoLoaderPath = require.resolve('@vusion/doc-loader/lib/auto-loader');
const HTMLPlugin = require('html-webpack-plugin');

module.exports = function chainDoc(api, vueConfig, vusionConfig) {
    vueConfig.publicPath = vusionConfig.docs ? vusionConfig.docs.base : '/public/';
    vueConfig.outputDir = 'public';
    vueConfig.runtimeCompiler = true;
    vueConfig.productionSourceMap = false;

    api.chainWebpack((config) => {
        config.entryPoints.clear();
        config.entry('docs')
            .add(require.resolve('@vusion/doc-loader/views/index.js'));

        config.module.rule('entry')
            .test(/@vusion[\\/]doc-loader[\\/]views[\\/]empty\.js$/)
            .use('auto-loader')
            .loader(autoLoaderPath)
            .options(vusionConfig);

        // @TODO: thread-loader error with md-vue-loader
        config.module.rule('js').uses.delete('thread-loader');

        // @TODO: Eslint applied to markdown error
        // @TODO: Cache loader
        config.module.rule('markdown')
            .test(/\.md$/)
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
        config.optimization.splitChunks(undefined);

        if (!vusionConfig.theme) {
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

        config.plugins.has('extract-css') && config.plugin('extract-css')
            .tap(([options]) => {
                options.filename = vusionConfig.theme ? `css/[name]-theme-${vusionConfig.theme}.css` : 'css/[name].css';
                return [options];
            });

        const docsPath = path.resolve(process.cwd(), 'docs');
        const docsComponentsPath = path.resolve(docsPath, 'components');
        const docsViewsPath = path.resolve(docsPath, 'views');
        const docsImportsPath = path.resolve(docsPath, 'imports.js');

        config.plugin('define-docs')
            .use(webpack.DefinePlugin, [{
                DOCS_PATH: fs.existsSync(docsPath) ? JSON.stringify(docsPath) : undefined,
                DOCS_COMPONENTS_PATH: fs.existsSync(docsComponentsPath) ? JSON.stringify(docsComponentsPath) : undefined,
                DOCS_VIEWS_PATH: fs.existsSync(docsViewsPath) ? JSON.stringify(docsViewsPath) : undefined,
                DOCS_IMPORTS_PATH: fs.existsSync(docsImportsPath) ? JSON.stringify(docsImportsPath) : undefined,
            }]);
    });
};
