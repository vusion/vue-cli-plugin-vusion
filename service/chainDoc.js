const fs = require('fs');
const path = require('path');
const webpack = require('webpack');
const HTMLPlugin = require('html-webpack-plugin');
const HTMLTagsPlugin = require('html-webpack-tags-plugin');
const autoLoaderPath = require.resolve('../scenes/doc/loaders/auto-loader');
const entryLoaderPath = require.resolve('../scenes/doc/loaders/entry-loader');
const yamlDocLoaderPath = require.resolve('../webpack/loaders/yaml-doc-loader');
const MiniCSSExtractPlugin = require('@vusion/mini-css-extract-plugin');
const chainCSSOneOfs = require('../webpack/chainCSSOneOfs');
const vusion = require('vusion-api');

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
                            tokens[idx].attrPush([':to', `{ hash: '${attr[1]}' }`]);
                            tokens[idx].attrs.splice(aIndex, 1);
                        }
                    }
                }],
                [iterator, 'link_converter', 'link_close', (tokens, idx) => tokens[idx].tag = 'u-link'],
            ],
            showCodeLineCount: 5,
            codeProcess(live, code, content, lang, modifier) {
                const relativePath = path.relative(process.cwd(), this.loader.resourcePath).replace(/\\/g, '/').replace(/^(\.\.\/)+/, '');

                if (live) {
                    const lineCount = content.split('\n').length;
                    return `<u-code-example
:show-code="${lineCount <= this.options.showCodeLineCount}"
:show-detail="${lang === 'vue'}"
file-path="${relativePath}">
<div${modifier ? ' style="' + modifier + '"' : ''}>${live}</div>
<div slot="code">${code}</div>
</u-code-example>\n\n`;
                } else
                    return code;
            },
        })
        .end();
}

module.exports = function chainDoc(api, vueConfig, vusionConfig) {
    vueConfig.publicPath = vusionConfig.docs && vusionConfig.docs.base ? vusionConfig.docs.base : '';
    vueConfig.outputDir = 'public';
    vueConfig.runtimeCompiler = true;
    vueConfig.productionSourceMap = false;
    const pkg = require(vusionConfig.packagePath);

    api.chainWebpack((config) => {
        config.entryPoints.clear();
        if (vusionConfig.type === 'library')
            config.entry('docs').add(require.resolve('../scenes/doc/views/library.js'));
        else if (vusionConfig.type === 'component' || vusionConfig.type === 'block')
            config.entry('docs').add(require.resolve('../scenes/doc/views/material.js'));

        // Make sure vue & vue-router unique
        config.resolve.alias
            .set('vue$', require.resolve('vue/dist/vue.esm.js'))
            .set('vue-router$', require.resolve('vue-router/dist/vue-router.esm.js'));

        config.module.rule('doc-config')
            .test(/[\\/]scenes[\\/]doc[\\/]views[\\/]empty\.js$/)
            .use('auto-loader')
            .loader(autoLoaderPath)
            .options(vusionConfig);

        const docsPath = path.resolve(process.cwd(), vusionConfig.docsPath || 'docs');
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
            .test(/[\\/]scenes[\\/]doc[\\/]views[\\/]library\.js$/)
            .use('entry-loader')
            .loader(entryLoaderPath)
            .options(defineOptions);

        // 很多 loader 与 Plugin 有结合，所以 thread-loader 不能开启
        config.module.rule('js').uses.delete('thread-loader');

        // Eslint 需要删除 @vue/cli-plugin-eslint
        chainMarkdown(config, config.module.rule('markdown').test(/\.md$/));

        chainMarkdown(config, config.module.rule('yaml-doc').test(/[\\/]api\.yaml$/))
            .use('yaml-doc')
            .loader(yamlDocLoaderPath);

        // 不需要，先关了
        config.optimization.splitChunks({
            cacheGroups: {
                vendors: false,
                default: false,
            },
        });

        const htmlCommonOptions = {
            chunks: 'all',
            hash: false,
            title: vusionConfig.docs && vusionConfig.docs.title || 'Vusion 组件库',
            favicon: path.resolve(require.resolve('../index.js'), '../logo.png'),
        };

        if (vusionConfig.type === 'component' || vusionConfig.type === 'block') {
            const componentName = vusion.utils.kebab2Camel(path.basename(pkg.name, '.vue'));
            htmlCommonOptions.title = componentName + (vusionConfig.title ? ' ' + vusionConfig.title : '') + ' - Vusion 物料平台';
        }

        // if (!Object.keys(vusionConfig.theme).length <= 1) {
        config.plugin('html')
            .use(HTMLPlugin, [Object.assign({}, htmlCommonOptions, {
                filename: 'index.html',
                template: path.resolve(require.resolve('../scenes/doc/views/library.js'), '../index.html'),
            })]);
        // For history mode 404 on GitHub
        // config.plugin('html-404')
        //     .use(HTMLPlugin, [Object.assign({}, htmlCommonOptions, {
        //         filename: '404.html',
        //         template: path.resolve(require.resolve('../scenes/doc/views/library.js'), '../index.html'),
        //     })]);
        // } else {
        //     config.plugin('html')
        //         .use(HTMLPlugin, [Object.assign({}, htmlCommonOptions, {
        //             filename: 'index.html',
        //             template: path.resolve(require.resolve('../scenes/doc/views/library.js'), '../theme.html'),
        //             inject: false,
        //         })]);
        //     // config.plugin('html-404')
        //     //     .use(HTMLPlugin, [Object.assign({}, htmlCommonOptions, {
        //     //         filename: '404.html',
        //     //         template: path.resolve(require.resolve('../scenes/doc/views/library.js'), '../theme.html'),
        //     //         inject: false,
        //     //     })]);
        // }
        if (vusionConfig.type === 'component' || vusionConfig.type === 'block') {
            // 在 dev 模式时便需将 Cloud UI 提取出来

            config.externals({
                vue: 'Vue',
                'cloud-ui.vusion': 'CloudUI',
            });

            const pkg = require(vusionConfig.packagePath);
            let version = '0.6.0';
            if (pkg.peerDependencies['cloud-ui.vusion'])
                version = pkg.peerDependencies['cloud-ui.vusion'];
            else if (pkg.dependencies['cloud-ui.vusion'])
                version = pkg.dependencies['cloud-ui.vusion'];
            version = version.replace(/^[^\d]+/, '').split('.').slice(0, 2).join('.');

            const docStaticURL = (vusionConfig.docStaticURL || 'https://static-vusion.163yun.com').replace(/\/$/g, '');

            config.plugin('html-tags').after('html')
                .use(HTMLTagsPlugin, [
                    { tags: [
                        `${docStaticURL}/packages/vue@2/dist/vue${process.env.NODE_ENV === 'development' ? '' : '.min'}.js`,
                        `${docStaticURL}/packages/cloud-ui.vusion@${version}/dist-theme/index.css`,
                        `${docStaticURL}/packages/cloud-ui.vusion@${version}/dist-theme/index.js`,
                        `${docStaticURL}/packages/cloud-ui.vusion@${version}/dist-doc-entry/index.css`,
                        `${docStaticURL}/packages/cloud-ui.vusion@${version}/dist-doc-entry/index.js`,
                    ], append: false, hash: false },
                ]);
        }

        if (config.plugins.has('extract-css')) { // Build mode
            chainCSSOneOfs(config, (oneOf, modules) => {
                oneOf.use('extract-css-loader')
                    .loader(MiniCSSExtractPlugin.loader)
                    .options({
                        publicPath: '../',
                        hmr: false,
                    });
            });
            config.plugin('extract-css').use(MiniCSSExtractPlugin, [{
                filename: 'css/[name].css',
                themeFilename: 'css/[name]-theme-[theme].css',
                themes: Object.keys(vusionConfig.theme),
            }]);
        }

        if (config.plugins.has('icon-font-plugin') && !vueConfig.publicPath) {
            config.plugin('icon-font-plugin')
                .tap(([options]) => {
                    options.publicPath = '../fonts'; // @TODO: this option is weird
                    return [options];
                });
        }

        config.plugin('define-docs')
            .use(webpack.DefinePlugin, [defineOptions]);
    });
};
