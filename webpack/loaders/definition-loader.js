const parseDefinition = require('./definition-loader/parse');

module.exports = function (source, map) {
    const definition = parseDefinition(source);

    const output = `export default function (Component) {
        const definition = Component.options.__definition = ${source};
        const componentOptions = Component.options;
        ${definition}
    }`;

    this.callback(null, output, map);
    // console.log(output);
};
