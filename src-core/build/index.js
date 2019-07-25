const buildAdapter = require('./adapter');

module.exports = (api) => {
    api.registerCommand('vusion:build',
        {
            description: 'Vusion BUILD',
            usage: 'vue-cli-service vusion:build [options]',
            options: {
                '--config-path': 'Vusion config path',
                '--entry-path': 'Vusion config path',
                '--theme': 'Choose theme',
                '--library-path': 'Library entry path. To be `./index.js` by default if project type is `library`',
                '--port': 'Web Server Port',
                '--no-open': 'Disable to open browser at the beginning',
                '--no-hot': 'Disable to hot reload',
                '--verbose': 'Show more information',
                '--extract-css': 'Extract CSS by ExtractTextWebpackPlugin in build mode',
                '--uglify-js': 'Compress and mangle JS by UglifyjsWebpackPlugin in build mode',
                '--minify-js': 'Minify JS only in `build` mode. Set `true` or `babel-minify` to use BabelBabelMinifyWebpackPlugin, set `uglify-js` to use UglifyjsWebpackPlugin as same as `--uglify`',
                '--force-shaking': 'Force to enable tree shaking under this path without care of side effects. It\'s different from default tree shaking of webpack.',
                '--experimental': 'Enable some experimental loaders or plugins',
                '--resolve-priority': 'Priority to resolve modules or loaders, "cwd"(default) or "cli"',
            },
        },
        (args) => {
            process.env.NODE_ENV = 'production';
            buildAdapter(api, args);
        });
};
