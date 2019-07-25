const dev = require('./dev');
const build = require('./build');
module.exports = function (api) {
    dev(api);
    build(api);
};
