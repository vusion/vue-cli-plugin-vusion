const parseDefinition = require('./parse');

module.exports = function (source, map) {
    const definition = parseDefinition(source);

    const output = `module.exports = function (Component) {
        const componentOptions = Component.options;
        ${definition}
    }`;

    this.callback(null, output, map);
};
