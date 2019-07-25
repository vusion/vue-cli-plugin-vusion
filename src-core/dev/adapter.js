const path = require('path');
const opn = require('opn');
const ora = require('ora');
const cliCore = require('vusion-cli-core').default;
const FriendlyErrorsWebpackPlugin = require('friendly-errors-webpack-plugin');
const notifier = require('node-notifier');
const tryRequire = require('try-require');
const webpack = require('webpack');
const WebpackDevServer = require('webpack-dev-server');
const checker = require('../checker');
const {
    checkPort, createDomain, addDevServerEntryPoints, merge,
} = require('../utils/index');

function adapterFac(api, args) {
    return function (factory, vusionConfig, webpackConfigInVusionConfig) {
        if (!checker.checkNode() || !checker.checkVersion(vusionConfig.version))
            process.exit(1);
        checker.checkUpgrade();
        if (args['entry-path'])
            vusionConfig.webpack.entry = { bundle: args['entry-path'] };
        if (args['library-path'])
            vusionConfig.libraryPath = args['library-path'];
        if (args.port)
            vusionConfig.webpackDevServer.port = args.port;
        if (typeof args.open !== undefined)
            vusionConfig.open = args.open;
        if (typeof args.hot !== undefined)
            vusionConfig.hot = args.hot;
        if (typeof args.verbose !== undefined)
            vusionConfig.verbose = args.verbose;
        if (args['resolve-priority'])
            vusionConfig.resolvePriority = args['resolve-priority'];

        let options = vusionConfig.webpackDevServer || {};
        options = {
            host: options.host || 'localhost',
            port: options.port || 9000,
            useLocalIp: options.useLocalIp,
        };

        const packagePath = path.resolve(process.cwd(), 'package.json');
        const packageJSON = tryRequire(packagePath);
        const title = packageJSON && packageJSON.name || 'Vusion project';
        checkPort(options.port, options.host)
            .then((port) => {
                options.port = port;
                const domain = createDomain(options);
                api.chainWebpack((chain) => {
                    factory(chain);
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
                });

                const webpackConfig = api.resolveWebpackConfig();
                merge(webpackConfig, webpackConfigInVusionConfig);
                if (!webpackConfig.entry || Object.keys(webpackConfig.entry).length === 0) {
                    // 如果没写的话，会默认指定一个
                    webpackConfig.entry = {
                        bundle: './index.js',
                    };
                }
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
                            opn(domain);
                        process.send && process.send(vusionConfig);
                        resolve();
                    });
                });
            });
    };
}
module.exports = function (api, args) {
    const adapter = adapterFac(api, args);
    cliCore(adapter, 'dev', args['config-path'], args.theme);
};
