const vusion = require('vusion-api');

const chainDefault = require('./service/chainDefault');
const registerLibraryBuild = require('./service/registerLibraryBuild');
const registerDoc = require('./service/registerDoc');
const registerDocBuild = require('./service/registerDocBuild');
const registerDesigner = require('./service/registerDesigner');

module.exports = function (api, vueConfig) {
    // 需要提前知晓 theme, mode 等信息
    const args = require('minimist')(process.argv.slice(2), {
        boolean: ['apply-theme'],
        alias: {
            o: 'output-path',
        },
    });
    const vusionConfig = vusion.config.resolve(process.cwd(), undefined, args);

    chainDefault(api, vueConfig, vusionConfig);
    registerLibraryBuild(api, vueConfig, vusionConfig);
    registerDoc(api, vueConfig, vusionConfig);
    registerDocBuild(api, vueConfig, vusionConfig);
    registerDesigner(api, vueConfig, vusionConfig, args);
};

module.exports.defaultModes = {
    'library-build': 'production',
    doc: 'development',
    'doc-build': 'production',
    designer: 'development',
};
