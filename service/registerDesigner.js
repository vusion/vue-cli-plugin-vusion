const fs = require('fs');
const path = require('path');
const HTMLPlugin = require('html-webpack-plugin');
const autoLoaderPath = require.resolve('../scenes/designer/auto-loader');

module.exports = function registerDesigner(api, vueConfig, vusionConfig, args) {
    if (args._[0] === 'designer') {
        process.env.DESIGNER = true;
        vueConfig.pages = {
            designer: {
                entry: require.resolve('../scenes/designer/views/index.js'),
                filename: 'index.html',
                template: path.resolve(require.resolve('@vusion/doc-loader/views/index.js'), '../index.html'),
                chunks: 'all',
                hash: true,
            },
        };
    }

    const serveCommand = api.service.commands.serve;

    api.registerCommand('designer', {
        description: 'Run designer server for vusion-vscode',
        usage: 'vue-cli-service designer',
        options: serveCommand.opts.options,
    }, (args) => {
        process.env.NODE_ENV = 'development';

        vueConfig.devServer = vueConfig.devServer || {};
        vueConfig.devServer.port = 12800;
        vueConfig.runtimeCompiler = true;
        vueConfig.productionSourceMap = false;

        // vueConfig.publicPath = vusionConfig.docs && vusionConfig.docs.base ? vusionConfig.docs.base : '';
        // vueConfig.outputDir = 'public';
        // vueConfig.productionSourceMap = false;

        api.chainWebpack((config) => {
            // config.devtool('eval');

            // Make sure vue & vue-router unique
            config.resolve.alias
                .set('vue$', path.resolve(process.cwd(), 'node_modules/vue/dist/vue.esm.js'))
                .set('vue-router$', path.resolve(process.cwd(), 'node_modules/vue-router/dist/vue-router.esm.js'));
            //     const isVuePackage = vusionConfig.type === 'component' || vusionConfig.type === 'block';
            //     config.resolve.alias
            //         .set('proto-ui', isVuePackage ? 'proto-ui.vusion/dist' : 'proto-ui.vusion');

            config.module.rule('designer-config')
                .test(/vue-cli-plugin-vusion[\\/]scenes[\\/]designer[\\/]views[\\/]empty\.js$/)
                .use('auto-loader')
                .loader(autoLoaderPath)
                .options(vusionConfig);

            //     const defineOptions = {
            //         type: vusionConfig.type,
            //         DOCS_PATH: fs.existsSync(docsPath) ? JSON.stringify(docsPath) : undefined,
            //         DOCS_COMPONENTS_PATH: fs.existsSync(docsComponentsPath) ? JSON.stringify(docsComponentsPath) : undefined,
            //         DOCS_VIEWS_PATH: fs.existsSync(docsViewsPath) ? JSON.stringify(docsViewsPath) : undefined,
            //         DOCS_IMPORTS_PATH: fs.existsSync(docsImportsPath) ? JSON.stringify(docsImportsPath) : undefined,
            //     };

            //     config.module.rule('doc-entry')
            //         .test(/@vusion[\\/]doc-loader[\\/]views[\\/]index\.js$/)
            //         .use('entry-loader')
            //         .loader(entryLoaderPath)
            //         .options(defineOptions);

            // 很多 loader 与 Plugin 有结合，所以 thread-loader 不能开启
            config.module.rule('js').uses.delete('thread-loader');

            // 嫌麻烦，先关了！
            config.optimization.splitChunks({
                cacheGroups: {
                    vendors: false,
                    default: false,
                },
            });

            config.module.rule('vue').use('vue-loader').tap((options) => {
                options.compilerOptions.modules = [require('../scenes/designer/transform')];
                return options;
            });
            config.module.rule('vue-multifile').use('vue-loader').tap((options) => {
                options.compilerOptions.modules = [require('../scenes/designer/transform')];
                return options;
            });

            // console.log(config.toString());
            // process.exit(0);
        //     config.plugin('define-docs')
        //         .use(webpack.DefinePlugin, [defineOptions]);
        });
        return serveCommand.fn(args);
    });
};
