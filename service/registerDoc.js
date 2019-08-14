const path = require('path');
const iterator = require('markdown-it-for-inline');

module.exports = function registerDoc(api, vueConfig, vusionConfig) {
    const serveCommand = api.service.commands.serve;

    api.registerCommand('doc', {
        description: 'Run documents server',
        usage: 'vue-cli-service doc',
        options: serveCommand.opts.options,
    }, (args) => {
        api.chainWebpack((config) => {
            config.entryPoints.clear();
            config.entry('docs')
                .add(require.resolve('@vusion/doc-loader/views/index.js'));

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
        });

        return serveCommand.fn(args);
    });
};
