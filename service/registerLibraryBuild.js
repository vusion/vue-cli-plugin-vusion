const path = require('path');
const chainCSSOneOfs = require('../webpack/chainCSSOneOfs');

module.exports = function registerLibraryBuild(api, vueConfig, vusionConfig) {
    const buildCommand = api.service.commands.build;

    api.registerCommand('library-build', {
        description: 'Run documents server',
        usage: 'vue-cli-service library-build',
        options: Object.assign({
            '--theme': 'Which theme',
            '--mode': 'If is "raw", remove babel-loader, icon-font-loader, css-sprite-loader, svg-classic-sprite-loader',
            '--base-css': 'Base CSS path',
            '--global-css': 'Global CSS path',
        }, buildCommand.opts.options),
    }, (args) => {
        vueConfig.outputDir = 'dist';

        api.chainWebpack((config) => {
            config.entryPoints.clear();
            config.entry('index')
                .add(vusionConfig.baseCSSPath)
                .add('./index.js');

            config.output.filename('[name].js')
                .chunkFilename('[name].[contenthash:8].js')
                .library(vusionConfig.CamelName || 'Library')
                .libraryTarget('umd')
                .umdNamedDefine(true);

            config.externals({
                vue: {
                    root: 'Vue',
                    commonjs: 'vue',
                    commonjs2: 'vue',
                    amd: 'vue',
                },
            });

            chainCSSOneOfs(config, (oneOf, modules) => {
                oneOf.use('extract-css-loader').tap((options) => {
                    options.publicPath = '';
                    return options;
                });
            });

            config.plugin('extract-css')
                .tap(([options]) => {
                    options.filename = vusionConfig.theme ? `theme-${vusionConfig.theme}.css` : '[name].css';
                    options.chunkFilename = options.chunkFilename.replace(/^css\//, '');
                    return [options];
                });

            config.optimization.splitChunks(undefined);

            config.plugin('html')
                .tap(([options]) => [Object.assign(options, {
                    filename: 'demo.html',
                    template: path.resolve(require.resolve('@vusion/doc-loader/views/index.js'), '../demo.html'),
                    title: vusionConfig.docs && vusionConfig.docs.title,
                    hash: true,
                    inject: 'head',
                })]);
        });

        return buildCommand.fn(args);
    });
};
