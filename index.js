// require('../lib/register'); 这个有么有什么影响呢？
// const resolver = require('../config/resolve');
const addDevCmd = require('./src-reborn/cmd/dev');
const addBuildCmd = require('./src-reborn/cmd/build');
module.exports = function (api, options) {
    addDevCmd(api);
    addBuildCmd(api);
};

// module.exports = (api, options, rootOptions) => {
//     api.extendPackage({
//         devDependencies: {
//             '@vusion/css-loader': '^0.4.0',
//             '@vusion/doc-loader': '^0.10.1',
//             '@vusion/md-vue-loader': '^1.0.1',
//             '@vusion/vue-loader': '~14.2.1',
//             'vue-multifile-loader': '~14.2.2',
//             'base-css-image-loader': '^0.2.4',
//         },
//     });
// };
