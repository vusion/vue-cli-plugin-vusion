module.exports = function (css, map, meta) {
    const variables = Object.assign({}, meta.ast.root.variables, meta.ast.root.cssProperties);
    return `module.exports=${JSON.stringify(variables)}`;
};
