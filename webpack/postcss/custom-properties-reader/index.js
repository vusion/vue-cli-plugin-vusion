const postcss = require('postcss');
const getCustomPropertiesFromRoot = require('./get-custom-properties');
const transformProperties = require('./transform-properties');
module.exports = postcss.plugin('postcss-custom-properties-reader', (opts) => (root) => {
    const customProperties = getCustomPropertiesFromRoot(root);
    transformProperties(root, customProperties);
});