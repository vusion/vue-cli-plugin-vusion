const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const AddAssetHtmlPlugin = require('add-asset-html-webpack-plugin');
const manifest = process.env.NODE_ENV === 'production' ? require('./dll/vendor.manifest.json') : require('./dll/vendor.dev.manifest.json');
const vendorPath = process.env.NODE_ENV === 'production' ? path.resolve(__dirname, 'dll/vendor.js') : path.resolve(__dirname, 'dll/vendor.dev.js');

module.exports = {
    version: '>=0.8.2',
    type: 'app',
    staticPath: './static',
    docs: false,
    extractCSS: true,
    sourceMap: false,
    libraryPath: './src',
    babel: true,
    // forceShaking: 'proto-ui.vusion',
    webpack: {
        entry: {
            // babel-polyfill 与 whatwg-fetch 为了兼容低版本浏览器
            // 而且在这里必须添加，相当于一个 import，否则 Dll 不知道要引入此包
            index: ['@babel/polyfill', 'whatwg-fetch', './src/views/index/index.js'],
            dashboard: ['@babel/polyfill', 'whatwg-fetch', './src/views/dashboard/index.js'],
            login: ['@babel/polyfill', 'whatwg-fetch', './src/views/login/index.js'],
        },
        resolve: {
            alias: {
                vue$: path.resolve(__dirname, 'node_modules/vue/dist/vue.esm.js'),
                'vue-router$': path.resolve(__dirname, 'node_modules/vue-router/dist/vue-router.esm.js'),
                assets: path.resolve(__dirname, 'src/assets'),
            },
        },
        optimization: {
            splitChunks: {
                cacheGroups: {
                    common: {
                        chunks: 'initial',
                        minChunks: 3,
                        name: 'common',
                        enforce: true,
                    },
                },
                // chunks: 'all'
            },
        },
        plugins: [
            new HtmlWebpackPlugin({
                filename: 'index.html',
                hash: true,
                chunks: ['common', 'index'],
                template: './src/views/index/index.html',
            }),
            new HtmlWebpackPlugin({
                filename: 'dashboard.html',
                hash: true,
                chunks: ['common', 'dashboard'],
                template: './src/views/dashboard/index.html',
            }),
            new HtmlWebpackPlugin({
                filename: 'login.html',
                hash: true,
                chunks: ['common', 'login'],
                template: './src/views/login/index.html',
            }),
            // 关联生成的 dll 信息文件
            new webpack.DllReferencePlugin({
                manifest,
            }),
            // 将 vendor.js 带上 hash 并注入到 html 中
            new AddAssetHtmlPlugin({
                filepath: vendorPath,
                hash: true,
                includeSourcemap: false,
            }),
            // // 将多个 entry chunk 的公共代码打包成公共 chunk
            // new webpack.optimize.CommonsChunkPlugin({
            //     name: 'common',
            //     minChunks: 3,
            // }),
            // // 将子 chunk 的公共代码打包进父 chunk 中
            // new webpack.optimize.CommonsChunkPlugin({
            //     children: true,
            //     minChunks: 3,
            // }),
        ],
    },
};
