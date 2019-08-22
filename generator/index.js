const webpack = require('webpack');
const path = require('path');
module.exports = (api) => {
    api.extendPackage({
        // scripts: dll
        dependencies: {
            'proto-ui.vusion': '^0.4.12',
            'vue-router': '^3.0.1',
            'vusion-utils': '^0.4.4',
        },
        devDependencies: {
            // 'vue-cli-plugin-vusion': '^0.5.6',
            // '@vue/cli-plugin-eslint': undefined,
            // 'babel-eslint': undefined,
            // 'eslint-plugin-vue': undefined,
            eslint: '^5.15.3',
            'eslint-config-vusion': '^3.0.1',
        },
        // eslintConfig: undefined,
        // postcss: undefined,
    });
    // 渲染的模板？
    api.render('./template');

    api.onCreateComplete(() => {
        const webpackDll = require(path.resolve(process.cwd(), 'webpack.dll.config.js'));
        webpack(webpackDll(process.env), (err) => {
            if (err)
                console.error(err);
        });
    });
};
