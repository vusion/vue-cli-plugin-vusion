const chainDoc = require('./chainDoc');
const HTMLTagsPlugin = require('html-webpack-tags-plugin');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = function registerDocBuild(api, vueConfig, vusionConfig) {
    const buildCommand = api.service.commands.build;

    api.registerCommand('doc-build', {
        description: 'Build documentation',
        usage: 'vue-cli-service doc-build',
        options: buildCommand.opts.options,
    }, (args) => {
        chainDoc(api, vueConfig, vusionConfig);

        // Cloud UI 在打包时提取出来
        api.chainWebpack((config) => {
            config.externals({
                vue: 'Vue',
                'cloud-ui.vusion': 'CloudUI',
            });

            if (vusionConfig.type === 'library') {
                config.plugin('copy-dist')
                    .use(CopyPlugin, [[
                        { from: './dist', to: 'dist', ignore: ['.*'] },
                        { from: './dist-theme', to: 'dist-theme', ignore: ['.*'] },
                    ]]);

                config.plugin('html-tags').after('html')
                    .use(HTMLTagsPlugin, [
                        { tags: [
                            'dist-theme/index.css',
                            { path: 'https://static-vusion.163yun.com/packages/vue@2/dist/vue.min.js', hash: false },
                            'dist-theme/index.js',
                        ], append: false, hash: true },
                    ]);
            }
        });

        return buildCommand.fn(args);
    });
};
