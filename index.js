const vusion = require('vusion-api');

const registerDefault = require('./service/registerDefault');
const registerDoc = require('./service/registerDoc');

module.exports = function (api, vueConfig) {
    const vusionConfig = vusion.config.resolve(process.cwd());

    registerDefault(api, vueConfig, vusionConfig);
    registerDoc(api, vueConfig, vusionConfig);
    // console.log(options);
};

module.exports.defaultModes = {
    doc: 'development',
};
