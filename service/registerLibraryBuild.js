const fs = require('fs');
const path = require('path');
const chainCSSOneOfs = require('../webpack/chainCSSOneOfs');
const MiniCSSExtractPlugin = require('@vusion/mini-css-extract-plugin');

module.exports = function registerLibraryBuild(api, vueConfig, vusionConfig) {
    const buildCommand = api.service.commands.build;

    api.registerCommand('library-build', {
        description: 'Run documents server',
        usage: 'vue-cli-service library-build',
        options: Object.assign({
            '--theme': 'Which theme',
            '--vusion-mode': 'If is "raw", remove babel-loader, icon-font-loader, css-sprite-loader, svg-classic-sprite-loader',
            '--base-css': 'Base CSS path',
            '--cache': 'Cache',
            '--output-path': 'Output path',
            '--public-path': 'Public path',
            '--src-path': 'Src path',
            '--library-path': 'Library path',
        }, buildCommand.opts.options),
    }, async (args) => {
        let cachePath;
        let versions;
        if (args.cache) {
            let cached = false;
            const cwd = process.cwd();
            const libraryPkg = require(path.join(cwd, 'package.json'));
            const vusionDeps = Object.keys(libraryPkg.dependencies).filter((key) => key.endsWith('.vusion'));
            versions = [libraryPkg.name + '@' + libraryPkg.version].concat(vusionDeps.map((name) => {
                const pkg = require(path.join(cwd, `../${name}/package.json`));
                return pkg.name + '@' + pkg.version;
            })).join('\n') + '\n';

            cachePath = path.resolve(vusionConfig.outputPath, '.version');
            if (fs.existsSync(cachePath))
                cached = fs.readFileSync(cachePath).toString() === versions;

            if (cached) {
                console.info('done.(from cache)');
                return;
            }
        }

        api.chainWebpack((config) => {
            config.entryPoints.clear();
            config.entry('index').add('./index.js');

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
                oneOf.use('extract-css-loader')
                    .loader(MiniCSSExtractPlugin.loader)
                    .options({
                        publicPath: './',
                        hmr: false,
                    });
            });
            config.plugin('extract-css')
                .use(MiniCSSExtractPlugin, [{
                    filename: '[name].css',
                    themeFilename: 'theme-[theme].css',
                    chunkFilename: '[name].[contenthash:8].css',
                    themes: Object.keys(vusionConfig.theme),
                }]);

            // 关掉 url(./img/xxx) -> url(img/xxx) 的处理
            config.plugin('optimize-css').tap(([options]) => {
                if (!options.cssnanoOptions.preset[1])
                    options.cssnanoOptions.preset[1] = {};
                options.cssnanoOptions.preset[1].normalizeUrl = false;
                options.cssnanoOptions.preset[1].calc = false;
                return [options];
            });
            config.optimization.splitChunks({
                cacheGroups: {
                    vendors: false,
                    default: false,
                },
            });

            config.plugin('html')
                .tap(([options]) => [Object.assign(options, {
                    filename: 'demo.html',
                    template: path.resolve(require.resolve('../scenes/doc/views/library.js'), '../demo.html'),
                    title: vusionConfig.docs && vusionConfig.docs.title,
                    hash: true,
                    inject: 'head',
                })]);
        });

        await buildCommand.fn(args);

        if (args.cache)
            fs.writeFileSync(cachePath, versions);
    });
};
