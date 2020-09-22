const parseDefinition = require('./definition-loader/parse');

module.exports = function (source, map) {
    const definition = parseDefinition(source);

    // const definition = Component.options.__definition = ${source};
    const output = `module.exports = function (Component) {
        const componentOptions = Component.options;
        ${definition}
    }`;

    this.callback(null, output, map);
    // console.log(output);
};
