const fs = require('fs');
const path = require('path');
const HTMLPlugin = require('html-webpack-plugin');
const autoLoaderPath = require.resolve('../scenes/designer/loaders/auto-loader');

// markdown-it
const iterator = require('markdown-it-for-inline');
const uslug = require('uslug');
const uslugify = (s) => uslug(s);

function chainMarkdown(config, rule) {
    return rule.use('cache-loader')
        .loader('cache-loader')
        .options(config.module.rule('vue').use('cache-loader').get('options'))
        .end()
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
                [iterator, 'link_converter', 'link_open', (tokens, idx) => {
                    tokens[idx].tag = 'u-link';
                    const aIndex = tokens[idx].attrIndex('href');
                    if (aIndex >= 0) {
                        const attr = tokens[idx].attrs[aIndex];
                        if (attr[1].startsWith('#')) {
                            tokens[idx].attrPush([':to', `{hash: '${attr[1]}'}`]);
                            tokens[idx].attrs.splice(aIndex, 1);
                        }
                    }
                }],
                [iterator, 'link_converter', 'link_close', (tokens, idx) => tokens[idx].tag = 'u-link'],
            ],
            showCodeLineCount: 5,
        })
        .end();
}

function readAndWriteFile(filePath, newRelativePath = '', handler) {
    let content = fs.readFileSync(filePath, 'utf8');
    content = handler(content);
    const newPath = path.resolve(filePath, newRelativePath);
    fs.writeFileSync(newPath, content, 'utf8');
    return newPath;
}

module.exports = function registerDesigner(api, vueConfig, vusionConfig, args) {
    if (args._[0] === 'designer') {
        process.env.DESIGNER = true;
        vueConfig.pages = {
            designer: {
                entry: require.resolve('../scenes/designer/views/index.js'),
                filename: 'index.html',
                template: path.resolve(require.resolve('../scenes/designer/views/index.js'), '../index.html'),
                chunks: 'all',
                hash: true,
            },
        };

        vueConfig.devServer.open = false;
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

            // Eslint 需要删除 @vue/cli-plugin-eslint
            // chainMarkdown(config, config.module.rule('markdown').test(/\.md$/));

            // 嫌麻烦，先关了！
            config.optimization.splitChunks({
                cacheGroups: {
                    vendors: false,
                    default: false,
                },
            });

            config.module.rule('vue').use('vue-loader').tap((options) => {
                // options.compiler = require('../scenes/designer/fork/build');
                options.compilerOptions.plugins = [require('../scenes/designer/transform').compilerPlugin];
                return options;
            });

            const vueTemplateCompilerPath = require.resolve('vue-template-compiler');
            const vueTemplateCompilerBrowserPath = path.resolve(vueTemplateCompilerPath, '../browser.js');
            const vueTemplateCompilerBuildPath = path.resolve(vueTemplateCompilerPath, '../build.js');
            readAndWriteFile(vueTemplateCompilerBrowserPath, '', (content) => content
                .replace(/(ast = parse\(template\.trim\(\), options\);)\s+(if|optimize)/g, `$1
                    (options.plugins || []).forEach((plugin) => plugin(ast, options, exports));
                $2`)
                .replace('exports.compile = compile;\n  exports.compileToFunctions', 'exports.compile = compile;\n  exports.generate = generate;\n  exports.compileToFunctions')
                .replace('exports.ssrCompile = compile$1;\n  exports.ssrCompileToFunctions', 'exports.compile = compile;\n  exports.ssrGenerate = generate$1;\n  exports.ssrCompileToFunctions'));
            readAndWriteFile(vueTemplateCompilerBuildPath, '', (content) => content
                .replace(/(ast = parse\(template\.trim\(\), options\);)\s+(if|optimize)/g, `$1
                (options.plugins || []).forEach((plugin) => plugin(ast, options, exports));\n$2`)
                .replace('exports.compile = compile;\nexports.compileToFunctions', 'exports.compile = compile;\nexports.generate = generate;\nexports.compileToFunctions')
                .replace('exports.ssrCompile = compile$1;\nexports.ssrCompileToFunctions', 'exports.compile = compile;\nexports.ssrGenerate = generate$1;\nexports.ssrCompileToFunctions')
                .replace(/(if \(options\) \{)(\s+if \(process)/, `$1
                if (options.filename) {
                    if (!options.filename.endsWith('.vue'))
                        options.filename = require('path').dirname(options.filename);
                    const vusion = require('vusion-api');
                    options.vueFile = new vusion.VueFile(options.filename);
                }
                $2`));

            const vueComponentCompilerUtilsPath = require.resolve('@vue/component-compiler-utils');
            const compileTemplatePath = path.resolve(vueComponentCompilerUtilsPath, '../compileTemplate.js');
            readAndWriteFile(compileTemplatePath, '', (content) => content
                // .replace(/\+ `var staticRenderFns/g, ' + (process.env.DESIGNER ? `var ast = ""\n` : "")$0')
                .replace('render, staticRenderFns', 'render, ast, staticRenderFns')
                // .replace('(render|staticRenderFns)', '(render|ast|staticRenderFns)')
                .replace(/(var __staticRenderFns__.+);/g, `$1 +
(process.env.DESIGNER ? "staticRenderFns.source = \`" + source.replace(/\\\\/g, '\\\\\\\\').replace(/\`/g, "\\\`") + "\`\\n" : '');
            `));

            const vueLoaderPath = require.resolve('vue-loader');
            const templateLoaderPath = path.resolve(vueLoaderPath, '../loaders/templateLoader.js');
            readAndWriteFile(templateLoaderPath, '', (content) => content
                .replace('scopeId: query.scoped ? `data-v-${id}` : null,', 'scopeId: `data-v-${id}`,\n  filename: this.resourcePath,'));

            // console.log(config.toString());
            // process.exit(0);
        //     config.plugin('define-docs')
        //         .use(webpack.DefinePlugin, [defineOptions]);
        });
        return serveCommand.fn(args);
    });
};
