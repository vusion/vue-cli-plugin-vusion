const vusion = require('vusion-api');

const chainDefault = require('./service/chainDefault');
const registerLibraryBuild = require('./service/registerLibraryBuild');
const registerDoc = require('./service/registerDoc');
const registerDocBuild = require('./service/registerDocBuild');
const { reConfigPostcss } = require('./webpack/chainCSS');
module.exports = function (api, vueConfig) {
    // 需要提前知晓 theme, mode 等信息
    const args = require('minimist')(process.argv.slice(2));
    const vusionConfig = vusion.config.resolve(process.cwd(), undefined, args);
    if (vusionConfig.type === 'app') {
        chainDefault(api, vueConfig, vusionConfig);
    } else {
        registerLibraryBuild(api, vueConfig, vusionConfig);
        registerDoc(api, vueConfig, vusionConfig);
        registerDocBuild(api, vueConfig, vusionConfig);
    }

    global.reConfigPostcss = reConfigPostcss(vueConfig, vusionConfig);
};

module.exports.defaultModes = {
    'library-build': 'production',
    doc: 'development',
    'doc-build': 'production',
};

// module.exports.reConfigPostcss = reConfigPostcss;
