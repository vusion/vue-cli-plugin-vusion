const path = require('path');
const postcss = require('postcss')
const postcssImportResolver = require('postcss-import-resolver');
const properties = require('./postcss/custom-properties-reader');
const computedProperties = require('./postcss/custom-properties-reader/get-custom-properties-computed');
const postcssVusionExtendMark = require('./postcss/extend-mark');
const postcssVusionExtendMerge = require('./postcss/extend-merge');
const map2obj = ((map) => {
    const obj = {};
    map.forEach((value, key) => { obj[key] = value; });
    return obj;
});
module.exports = function getVariablesPostcssPlugins(config) {
    const alias = map2obj(config.resolve.alias.store);
    const postcssExtendMark = postcssVusionExtendMark({
        resolve: postcssImportResolver({
            extensions: ['.js'],
            alias,
        }),
    });
    return [
        postcssExtendMark,
        require('postcss-import')({
            resolve: postcssImportResolver({
                alias,
            }),
            skipDuplicates: false,
            plugins: [postcssExtendMark],
        }),
        require('postcss-variables'),
        postcssVusionExtendMerge,
        properties,
        require('@vusion/postcss-calc'),
        computedProperties
    ];
};
