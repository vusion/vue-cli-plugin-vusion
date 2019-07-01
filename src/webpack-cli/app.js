const path = require('path');
const utils = require('base-css-image-loader/src/utils');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const baseConfig = require('./base');
module.exports = (api, config) => {
    baseConfig(api, config);
    api.chainWebpack((webpackConfig) => {
        webpackConfig.output
            .path(path.join(process.cwd(), 'public'))
            .publicPath('')
            .filename('[name].js')
            .chunkFilename('chunk.[name].[chunkhash:16].js');

        if (config.entry && config.entry.pages) {
            const entry = {};
            if (config.entry.pages === 'index') {
                entry.bundle = path.resolve(config.srcPath, 'views/index.js');
            } else if (Array.isArray(config.entry.pages)) {
                config.entry.pages.forEach((page) => entry[page] = path.resolve(config.srcPath, 'views', page, 'index.js'));
            }

            if (config.entry.prepend && config.entry.prepend.length)
                utils.prependToEntry(config.entry.prepend, entry);
            if (config.entry.append && config.entry.append.length)
                utils.appendToEntry(config.entry.append, entry);

            Object.keys(entry).forEach((key) => {
                webpackConfig.entry(key).add(entry[key]).end();
                webpackConfig.plugin('html-webpack-plugin')
                    .use(HtmlWebpackPlugin, {
                        filename: key + '.html',
                        hash: true,
                        chunks: config.entry.commons ? ['commons', key] : [key],
                        template: config.entry.template || path.resolve(__dirname, 'template.html'),
                    });
            });
            if (config.entry.commons) {
                // deprecated!
                // webpackConfig.plugin('webpack-common-chunk-plugin')
                //     .use(webpack.optimize.CommonsChunkPlugin, {
                //         name: 'commons',
                //         minChunks: 3,
                //     });

                // alternative https://github.com/webpack/webpack/issues/6357
                webpackConfig.optimization
                    .splitChunks({ cacheGroups: {
                        commons: {
                            chunks: 'initial',
                            minChunks: 3,
                            name: 'commons',
                            enforce: true,
                        },
                    } });
            }
            return webpackConfig;
        }
    });
};
