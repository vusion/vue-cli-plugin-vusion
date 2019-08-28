const path = require('path');
const postcssImportResolver = require('postcss-import-resolver');
const postcssVusionExtendMark = require('./postcss/extend-mark');
const postcssVusionExtendMerge = require('./postcss/extend-merge');

const map2obj = ((aMap) => {
    const obj = {};
    aMap.forEach((v, k) => { obj[k] = v; });
    return obj;
});

module.exports = function getPostcssPlugins(config, vueConfig, vusionConfig) {
    const alias = map2obj(config.resolve.alias.store);
    // @review
    // const userAlias = (vusionConfig.webpack && vusionConfig.webpack.resolve && vusionConfig.webpack.resolve.alias) || {};
    // const alias = Object.assign({}, map2obj(config.resolve.alias.store), userAlias);

    const postcssExtendMark = postcssVusionExtendMark({
        resolve: postcssImportResolver({
            extensions: ['.js'],
            alias,
        }),
    });

    // Postcss plugins
    return [
        postcssExtendMark,
        require('postcss-import')({
            resolve: postcssImportResolver({
                alias,
            }),
            skipDuplicates: false,
            plugins: [postcssExtendMark],
        }),
        require('postcss-url')({
        // Rewrite https://github.com/postcss/postcss-url/blob/master/src/type/rebase.js
        // 只需将相对路径变基，其它让 Webpack 处理即可
            url(asset, dir) {
                if (asset.url[0] !== '.')
                    return asset.url;

                let rebasedUrl = path.normalize(path.relative(dir.to, asset.absolutePath));
                rebasedUrl = path.sep === '\\' ? rebasedUrl.replace(/\\/g, '/') : rebasedUrl;
                rebasedUrl = `${rebasedUrl}${asset.search}${asset.hash}`;

                if (asset.url.startsWith('..'))
                    return rebasedUrl;
                else
                    return './' + rebasedUrl;
            },
        }),
        // precss removed
        require('postcss-variables'),
        require('postcss-preset-env')({
            stage: 0,
            browsers: config.browsers,
            features: {
                'image-set-function': false, // handle by css-sprite-loader
                'color-mod-function': true, // stage is -1, https://github.com/csstools/cssdb/blob/master/cssdb.json
            },
        }),
        // precss removed
        require('postcss-calc'),
        postcssVusionExtendMerge,
    ];
};
