const path = require('path');
const postcssImportResolver = require('postcss-import-resolver');
const properties = require('./postcss/postcss-custom-properties-reader');
const map2obj = ((map) => {
    const obj = {};
    map.forEach((value, key) => { obj[key] = value; });
    return obj;
});
module.exports = function getVariablesPostcssPlugins(config) {
    const alias = map2obj(config.resolve.alias.store);
    return [
        require('postcss-import')({
            resolve: postcssImportResolver({
                alias,
            }),
        }),
        require('postcss-variables'),
        properties,
    ];
};
