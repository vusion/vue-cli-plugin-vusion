const vusion = require('vusion-api');

const chainDefault = require('./service/chainDefault');
const chainWebWorker = require('./service/chainWebWorker');
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

    const configPath = args['vusion-config'] || process.env.VUSION_CONFIG_PATH;
    const vusionConfig = vusion.config.resolve(process.cwd(), configPath, args);

    chainDefault(api, vueConfig, vusionConfig);
    chainWebWorker(api);
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