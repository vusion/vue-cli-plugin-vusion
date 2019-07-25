const ora = require('ora');
const cliCore = require('vusion-cli-core').default;
const checker = require('../checker');
const webpack = require('webpack');

const {
    merge,
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

        api.chainWebpack(factory);
        const webpackConfig = api.resolveWebpackConfig();
        merge(webpackConfig, webpackConfigInVusionConfig);

        if (!webpackConfig.entry || Object.keys(webpackConfig.entry).length === 0) {
            // 如果没写的话，会默认指定一个
            webpackConfig.entry = {
                bundle: './index.js',
            };
        }
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
}

module.exports = function (api, args) {
    const adapter = adapterFac(api, args);
    cliCore(adapter, 'build', args['config-path'], args.theme);
};
