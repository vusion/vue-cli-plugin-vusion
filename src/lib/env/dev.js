const path = require('path');
const utils = require('../utils');
const tryRequire = require('try-require');
const webpack = require('webpack');
const FriendlyErrorsWebpackPlugin = require('friendly-errors-webpack-plugin');
const notifier = require('node-notifier');

const prepare = (webpackConfig, config, domain) => {
    const packagePath = path.resolve(process.cwd(), 'package.json');
    const packageJSON = tryRequire(packagePath);
    const title = packageJSON && packageJSON.name || 'Vusion project';
    // webpack 4.x 设置为 development
    // Enables NamedChunksPlugin and NamedModulesPlugin .
    webpackConfig.mode('development');

    if (config.friendly) {
        webpackConfig.plugin('friendly')
            .use(FriendlyErrorsWebpackPlugin, {
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
            });
    }
};

module.exports = (webpackConfig, config) => {
    let options = config.webpackDevServer || {};
    options = {
        host: options.host || 'localhost',
        port: options.port || 9000,
        useLocalIp: options.useLocalIp,
    };
    utils.checkPort(options.port, options.host)
        .then((port) => {
            options.port = port;
            const url = utils.createDomain(options);
            const { compiler, devOptions } = prepare(webpackConfig, url);
        });
};
