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

    api.chainWebpack((config) => {
        config.entryPoints.clear();
        config.entry('docs')
            .add(require.resolve('@vusion/doc-loader/views/index.js'));

        config.output.delete('library')
            .delete('libraryTarget')
            .delete('umdNamedDefine');
        config.externals(undefined);

        config.module.rule('entry')
            .test(/@vusion\/doc-loader\/views\/empty\.js$/)
            .use('auto-loader')
            .loader(autoLoaderPath)
            .options(vusionConfig);

        // @TODO: Cache loader
        config.module.rule('markdown')
            .test(/\.md$/)
            .use('vue-loader')
            .loader('vue-loader')
            .options({
                preserveWhitespace: false,
            })
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

        if (!vusionConfig.theme) {
            config.plugin('html')
                .use(HTMLPlugin, [{
                    filename: 'index.html',
                    template: path.resolve(require.resolve('@vusion/doc-loader/views/index.js'), '../index.html'),
                    chunks: ['docs'],
                    hash: true,
                }]);
            // For history mode 404 on GitHub
            config.plugin('html-404')
                .use(HTMLPlugin, [{
                    filename: '404.html',
                    template: path.resolve(require.resolve('@vusion/doc-loader/views/index.js'), '../index.html'),
                    chunks: ['docs'],
                    hash: true,
                }]);
        } else {
            config.plugin('html')
                .use(HTMLPlugin, [{
                    filename: 'index.html',
                    template: path.resolve(require.resolve('@vusion/doc-loader/views/index.js'), '../theme.html'),
                    chunks: ['docs'],
                    inject: false,
                }]);
            config.plugin('html-404')
                .use(HTMLPlugin, [{
                    filename: '404.html',
                    template: path.resolve(require.resolve('@vusion/doc-loader/views/index.js'), '../theme.html'),
                    chunks: ['docs'],
                    inject: false,
                }]);
        }

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
