const path = require('path');
const ora = require('ora');
const shell = require('shelljs');
const webpack = require('webpack');
const UglifyjsWebpackPlugin = require('uglifyjs-webpack-plugin');
const BabelMinifyWebpackPlugin = require('babel-minify-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const ForceShakingPlugin = require('../utils/vusion-tree-shaking');
const { toString } = require('webpack-chain');
const {
    merge,
} = require('../utils/index');

const prepareChain = function (vusionConfig) {
    return (chain) => {
        chain.entryPoints.clear();
        chain.module.rules.clear();
        chain.plugins.clear();
        const webpackScenaryFac = require(`../scenary/${vusionConfig.type}`);
        webpackScenaryFac(chain, vusionConfig, vusionConfig.webpack);
        chain.mode('production');

        chain.plugin('hash-module-ids').use(webpack.HashedModuleIdsPlugin);
        chain.plugin('loader-options').use(webpack.LoaderOptionsPlugin, [{
            minimize: true,
        }]);
        chain.plugin('banner').use(webpack.BannerPlugin, [{
            banner: 'Packed by Vusion.',
            entryOnly: true,
            test: /\.js$/,
        }]);
        if (vusionConfig.minifyJS === true || vusionConfig.minifyJS === 'babel-minify') {
            chain.plugin('babel-minify').use(BabelMinifyWebpackPlugin, [Object.assign({}, vusionConfig.options.BabelMinifyWebpackPlugin)]);
        } else if (vusionConfig.minifyJS === 'uglify-js' || vusionConfig.uglifyJS) {
            chain.plugin('uglify-js').use(UglifyjsWebpackPlugin, [Object.assign({
                cache: true,
                parallel: true,
                sourceMap: vusionConfig.sourceMap,
            }, vusionConfig.options.UglifyjsWebpackPlugin)]);
        }
        if (chain.entryPoints.store.size === 0) {
            chain.entry('bundle').add('./index.js');
        }
        // Remove output directory and copy static files
        if (vusionConfig.clean) {
            if (chain.output.get('path') !== process.cwd())
                shell.rm('-rf', chain.output.get('path'));
        }
        if (vusionConfig.staticPath) {
            const staticPaths = Array.isArray(vusionConfig.staticPath) ? vusionConfig.staticPath : [vusionConfig.staticPath];
            chain.plugin('CopyWebpackPlugin')
                .use(CopyWebpackPlugin, [
                    staticPaths.map((spath) => Object.assign({
                        from: path.resolve(process.cwd(), spath),
                        to: chain.output.get('path'),
                        ignore: ['.*'],
                    }, vusionConfig.options.CopyWebpackPlugin)),
                ]);
        }

        if (vusionConfig.forceShaking) {
            chain.plugin('force-shaking')
                .use(ForceShakingPlugin, [
                    Object.assign({
                        shakingPath: vusionConfig.forceShaking,
                    }, vusionConfig.options.ForceShakingPlugin),
                ]);
        }
    };
};
module.exports = function (api, vusionConfig) {
    api.chainWebpack(prepareChain(vusionConfig));
    const webpackConfig = api.resolveWebpackConfig();
    // console.log(toString(webpackConfig));
    merge(webpackConfig, vusionConfig.webpack);
    return new Promise((resolve, reject) => {
        const spinner = ora('Building for production...');
        spinner.start();
        webpack(webpackConfig, (err, stats) => {
            spinner.stop();
            if (err)
                return reject(err);

            process.stdout.write(stats.toString(vusionConfig.verbose ? { all: true, colors: true } : webpackConfig.stats) + '\n');

            resolve();
        });
    });
};
