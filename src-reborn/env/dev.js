const path = require('path');
const opn = require('opn');
const ora = require('ora');
const tryRequire = require('try-require');
const webpack = require('webpack');
const FriendlyErrorsWebpackPlugin = require('friendly-errors-webpack-plugin');
const notifier = require('node-notifier');
const WebpackDevServer = require('webpack-dev-server');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const { toString } = require('webpack-chain');

const {
    checkPort, createDomain, addDevServerEntryPoints, merge,
} = require('../utils/index');

const prepareChain = function (vusionConfig, domain) {
    return (chain) => {
        const packagePath = path.resolve(process.cwd(), 'package.json');
        const packageJSON = tryRequire(packagePath);
        const title = packageJSON && packageJSON.name || 'Vusion project';

        chain.entryPoints.clear();
        chain.module.rules.clear();
        chain.plugins.clear();
        const webpackScenaryFac = require(`../scenary/${vusionConfig.type}`);
        webpackScenaryFac(chain, vusionConfig, vusionConfig.webpack);
        chain.mode('development');
        if (vusionConfig.friendly) {
            chain.plugin('friendly')
                .use(FriendlyErrorsWebpackPlugin, [{
                    compilationSuccessInfo: {
                        messages: [`Your application is running here: ${domain}`],
                    },
                    onErrors: (severity, errors) => {
                        if (severity !== 'error')
                            return;

                        const error = errors[0];
                        const filename = error.file && error.file.split('!').pop();

                        notifier.notify({
                            title,
                            message: severity + ': ' + error.name,
                            subtitle: filename || '',
                            icon: path.resolve(__dirname, '../assets/vusion.png'),
                        });
                    },
                }]);
        }
        chain.performance.hints(false);
        chain.devtool('eval-source-map');

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
        if (chain.entryPoints.store.size === 0) {
            chain.entry('bundle').add('./index.js');
        }
    };
};
const generateVueCLIWebpackConfig = function (api, vusionConfig, domain) {
    api.chainWebpack(prepareChain(vusionConfig, domain));
    const webpackConfig = api.resolveWebpackConfig();
    return webpackConfig;
};
const prepareCompiler = function (vusionConfig, domain, adapter) {
    const webpackConfig = adapter();
    merge(webpackConfig, vusionConfig.webpack);
    const devOptions = Object.assign({
        contentBase: webpackConfig.output.path,
        publicPath: webpackConfig.output.publicPath || '',
        // clientLogLevel: vusionConfig.verbose ? 'info' : 'warning',
        overlay: true,
        // quiet: !vusionConfig.verbose,
        // noInfo: true,
        // inline: true,
        hot: vusionConfig.hot,
        stats: vusionConfig.verbose ? { all: true, colors: true } : webpackConfig.stats,
        historyApiFallback: true,
    }, vusionConfig.webpackDevServer);
    console.log(vusionConfig);
    vusionConfig.hot && addDevServerEntryPoints(webpackConfig, devOptions, domain);
    const compiler = webpack(webpackConfig);
    console.log(webpackConfig);
    console.log(devOptions);
    return { compiler, devOptions };
};
module.exports = function (api, vusionConfig) {
    let options = vusionConfig.webpackDevServer || {};
    options = {
        host: options.host || 'localhost',
        port: options.port || 9000,
        useLocalIp: options.useLocalIp,
    };
    checkPort(options.port, options.host)
        .then((port) => {
            options.port = port;
            const url = createDomain(options);
            // console.log(toString(api.resolveWebpackConfig()));
            const adapter = generateVueCLIWebpackConfig.bind(null, api, vusionConfig, url);
            const { compiler, devOptions } = prepareCompiler(vusionConfig, url, adapter);
            const server = new WebpackDevServer(compiler, devOptions);
            return new Promise((resolve, reject) => {
                const spinner = ora('First compiling for developing...');
                spinner.start();
                server.listen(options.port, options.host, (err) => {
                    if (err) {
                        console.error(err);
                        return reject(err);
                    }

                    compiler.plugin('done', () => spinner.stop());
                    // console.info('> Listening at ' + url + '\n');
                    if (vusionConfig.open && !process.env.TEST)
                        opn(url);
                    process.send && process.send(vusionConfig);
                    resolve();
                });
            });
        });
};
