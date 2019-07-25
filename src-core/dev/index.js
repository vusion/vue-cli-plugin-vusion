const devAdapter = require('./adapter');
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
            process.env.NODE_ENV = 'development';
            devAdapter(api, args);
        });
};
