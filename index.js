// require('../lib/register'); 这个有么有什么影响呢？
// const resolver = require('../config/resolve');
const devCmd = require('./src/cmd/dev');
module.exports = function (api, options) {
    devCmd(api);
};
