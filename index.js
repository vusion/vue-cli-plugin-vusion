const path = require('path');
const vusion = require('vusion-api');

const chainDefault = require('./service/chainDefault');
const registerLibraryBuild = require('./service/registerLibraryBuild');
const registerDoc = require('./service/registerDoc');
const registerDocBuild = require('./service/registerDocBuild');

module.exports = function (api, vueConfig) {
    // 需要提前知晓 theme, mode 等信息
    const args = require('minimist')(process.argv.slice(2));
    const vusionConfig = vusion.config.resolve(process.cwd());

    /* Merge args */
    if (args.theme)
        vusionConfig.theme = args.theme;
    if (args['vusion-mode'])
        vusionConfig.mode = args['vusion-mode'];
    if (args['base-css'])
        vusionConfig.globalCSSPath = path.resolve(process.cwd(), args['base-css']);
    if (args['global-css'])
        vusionConfig.globalCSSPath = path.resolve(process.cwd(), args['global-css']);

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
