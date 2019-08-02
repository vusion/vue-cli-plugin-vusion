const webpack = require('webpack');
const path = require('path');
module.exports = (api) => {
    api.extendPackage({
        dependencies: {
            'proto-ui.vusion': '~0.4.0-alpha.4',
            'vue-router': '^3.0.1',
            'vue-template-compiler': '^2.6.10',
            'vusion-utils': '^0.3.0',
        },
        devDependencies: {
            'add-asset-html-webpack-plugin': '^2.1.3',
            '@babel/polyfill': '^7.4.4',
            'whatwg-fetch': '^3.0.0',
        },
    });
    // 渲染的模板？
    api.render('./template');

    api.onCreateComplete(() => {
        const webpackDll = require(path.resolve(process.cwd(), 'webpack.dll.config.js'));
        webpack(webpackDll(process.env), (err) => {
            if (err)
                console.log(err);
        });
    });
};
