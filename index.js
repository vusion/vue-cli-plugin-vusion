const vusion = require('vusion-api');

const chainDefault = require('./service/chainDefault');
const registerLibraryBuild = require('./service/registerLibraryBuild');
const registerDoc = require('./service/registerDoc');
const registerDocBuild = require('./service/registerDocBuild');

module.exports = function (api, vueConfig) {
    const vusionConfig = vusion.config.resolve(process.cwd());

    chainDefault(api, vueConfig, vusionConfig);
    registerLibraryBuild(api, vueConfig, vusionConfig);
    registerDoc(api, vueConfig, vusionConfig);
    registerDocBuild(api, vueConfig, vusionConfig);
};

module.exports.defaultModes = {
    'library-build': 'production',
    doc: 'development',
    'doc-build': 'production',
};
