const checker = require('../checker');

const webpackEnvironmentFac = require('../env/dev');
const Config = require('webpack-chain');
module.exports = (api) => {
    api.registerCommand('vusion:dev',
        {
            description: 'Vusion DEV',
            usage: 'vue-cli-service vusion:dev [options]',
            options: {
                '--config-path': 'Vusion config path',
                '--entry-path': 'Vusion config path',
                '--theme': 'Choose theme',
                '--library-path': 'Library entry path. To be `./index.js` by default if project type is `library`',
                '--port': 'Web Server Port',
                '--no-open': 'Disable to open browser at the beginning',
                '--no-hot': 'Disable to hot reload',
                '--verbose': 'Show more information',
                '--resolve-priority': 'Priority to resolve modules or loaders, "cwd"(default) or "cli"',
            },
        },
        (args) => {
        // args['config-path']
        // require('../lib/register');
        // process.env.NODE_ENV = 'development';

            const config = require('../config/resolve')(args['config-path'], args.theme);

            if (!checker.checkNode() || !checker.checkVersion(config.version))
                process.exit(1);
            checker.checkUpgrade();

            if (args['entry-path'])
                config.webpack.entry = { bundle: args['entry-path'] };
            // if (program.hasOwnProperty('theme'))
            //     config.theme = program.theme;
            if (args['library-path'])
                config.libraryPath = args['library-path'];
            if (args.port)
                config.webpackDevServer.port = args.port;
            if (typeof args.open !== undefined)
                config.open = args.open;
            if (typeof args.hot !== undefined)
                config.hot = args.hot;
            if (typeof args.verbose !== undefined)
                config.verbose = args.verbose;
            if (args['resolve-priority'])
                config.resolvePriority = args['resolve-priority'];

            // const webpackChain = new Config();
            webpackEnvironmentFac(api, config);
        });
};
