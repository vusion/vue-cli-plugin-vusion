const path = require('path');
const color = require('color');
const postcssImportResolver = require('postcss-import-resolver');
const postcssVusionExtendMark = require('./postcss/extend-mark');
const postcssVusionExtendMerge = require('./postcss/extend-merge');

const map2obj = ((map) => {
    const obj = {};
    map.forEach((value, key) => { obj[key] = value; });
    return obj;
});

module.exports = function getPostcssPlugins(config, vueConfig, vusionConfig) {
    const alias = map2obj(config.resolve.alias.store);

    const postcssExtendMark = postcssVusionExtendMark({
        resolve: postcssImportResolver({
            extensions: ['.js'],
            alias,
        }),
    });

    const fixRatio = function (ratio) {
        if (ratio.endsWith('%')) {
            return ratio.replace('%', '') / 100;
        }
        return ratio;
    };
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
        require('postcss-functions')({
            functions: {
                // 按比例混合两种颜色
                mix(c1, c2, ratio = 0.5) {
                    ratio = fixRatio(ratio);
                    const mixed = color(c1).mix(color(c2), ratio);
                    return mixed.alpha() < 1 ? mixed.string() : mixed.hex();
                },
                lighten(c, ratio) {
                    ratio = fixRatio(ratio);
                    return color(c).lighten(ratio);
                },
                darken(c, ratio) {
                    ratio = fixRatio(ratio);
                    return color(c).darken(ratio);
                },
                saturate(c, ratio) {
                    ratio = fixRatio(ratio);
                    return color(c).saturate(ratio);
                },
                desaturate(c, ratio) {
                    ratio = fixRatio(ratio);
                    return color(c).desaturate(ratio);
                },
                // 背景色是深色，用这个函数可以得到一个浅色的 color
                yiq(c1, dark, light) {
                    return color(c1).isLight() ? dark : light;
                },
            },
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
            preserve: false,
            features: {
                'custom-properties': vusionConfig.applyTheme,
                'image-set-function': false, // handle by css-sprite-loader
                'color-mod-function': true, // stage is -1, https://github.com/csstools/cssdb/blob/master/cssdb.json
            },
        }),
        // precss removed
        require('@vusion/postcss-calc'),
        postcssVusionExtendMerge,
    ].concat(vusionConfig.postcss || []);
};
