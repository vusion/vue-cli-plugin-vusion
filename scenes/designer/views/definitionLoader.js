const generate = require('@babel/generator').default;
const babel = require('@babel/core');
const ScriptHandler = require('vusion-api/out/fs/ScriptHandler').default;

function walk(node, func, parent = null, index) {
    func(node, parent, index);
    const next = node.body || (node.consequent && node.consequent.body) || (node.alternate && node.alternate.body);
    next && next.forEach((child, index) => walk(child, func, node, index));
    node.left && walk(node.left, func, node);
    node.right && walk(node.right, func, node);
}

exports.definitionLoader = function (source, script) {
    const definition = JSON.parse(source);
    const $js = new ScriptHandler(script);

    const methods = (definition.logics || []).map((logic) => {
        walk(logic.definition, (node, parent, index) => {
            if (node.type === 'Start' || node.type === 'End' || node.type === 'Comment' || node.type === 'ForEachStatement') {
                node.type = 'Noop';
            } else if (node.type === 'Call')
                node.type = 'CallExpression';
            else if (node.type === 'CallMessageShow') {
                // console.log('STrt!!!')
                Object.assign(node, babel.parse(`this.$toast.show()`, { filename: 'file.js' }).program.body[0].expression, {
                    arguments: node.arguments,
                });
            } else if (node.type === 'CallGraphQL') {
                Object.assign(node, {
                    type: 'AwaitExpression',
                    argument: babel.parse(`this.$graphql.query('${node.queryKey}')`, { filename: 'file.js' }).program.body[0].expression,
                });
            }
        });

        const returnIdentifier = logic.definition.returns[0] ? logic.definition.returns[0].name : 'result';

        return `async ${logic.name}(${logic.definition.params.map((param) => param.name).join(', ')}) {
            ${logic.definition.variables.length ? 'let ' + logic.definition.variables.map((variable) => variable.name).join(', ') + ';' : ''}
            let ${returnIdentifier};
    
            ${generate({
        type: 'Program',
        body: logic.definition.body,
    }).code}
    
            return ${returnIdentifier};
        }`;
    });

    const data = (definition.variables || []).map((param) => param.name + ': undefined').join(',\n');

    const newScript = `export default { data(){ return { ${data} }}, methods:{ ${methods.join(',\n')} }}`;

    $js.merge(new ScriptHandler(newScript));
    return $js.generate({
        retainLines: false,
        comments: false,
    });
};
