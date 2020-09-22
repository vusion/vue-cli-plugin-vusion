const generate = require('@babel/generator').default;
const babel = require('@babel/core');

module.exports = function (source) {
    const definition = JSON.parse(source);

    function walk(node, func, parent = null, index) {
        func(node, parent, index);
        const next = (node.body && (Array.isArray(node.body) ? node.body : node.body.body)) || (node.consequent && node.consequent.body) || (node.alternate && node.alternate.body);
        next && Array.isArray(next) && next.forEach((child, index) => walk(child, func, node, index));
        node.left && walk(node.left, func, node);
        node.right && walk(node.right, func, node);
    }

    const methods = (definition.logics || []).map((logic) => {
        const returnIdentifier = logic.definition.returns[0] ? logic.definition.returns[0].name : 'result';

        walk(logic.definition, (node, parent, index) => {
            if (node.type === 'Start' || node.type === 'Comment' || node.type === 'ForEachStatement') {
                node.type = 'Noop';
            } else if (node.type === 'End') {
                Object.assign(node, babel.parse(`return ${returnIdentifier}`, { filename: 'file.js' }).program.body[0].expression);
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
            } else if (node.type === 'JSONSerialize') {
                Object.assign(node, babel.parse(`JSON.stringify()`, { filename: 'file.js' }).program.body[0].expression, {
                    arguments: node.arguments,
                });
            } else if (node.type === 'JSONDeserialize') {
                Object.assign(node, babel.parse(`JSON.parse()`, { filename: 'file.js' }).program.body[0].expression, {
                    arguments: node.arguments,
                });
            } else if (node.type === 'RaiseException') {
                const throwStatement = babel.parse(`throw new Error()`, { filename: 'file.js' }).program.body[0];
                throwStatement.argument.arguments = node.arguments;
                Object.assign(node, throwStatement);   
            }
        });

        console.info('JSON generate:', JSON.stringify(logic.definition.body));

        return `methods['${logic.name}'] = async function (${logic.definition.params.map((param) => param.name).join(', ')}) {
            with (this) {
                ${logic.definition.variables.length ? 'let ' + logic.definition.variables.map((variable) => variable.name).join(', ') + ';' : ''}
                let ${returnIdentifier};

                ${generate({
        type: 'Program',
        body: logic.definition.body,
    }).code}
            }
        }`;
    });

    const data = (definition.variables || []).map((param) => param.name + `: ${param.defaultValue}`).join(',\n');

    const output = `
        const methods = componentOptions.methods = componentOptions.methods || {};
        const data = function () {
            with (this) {
                const oldData = componentOptions.data && componentOptions.data !== data ? componentOptions.data.call(this) : {};
    
                return Object.assign(oldData, {
                    ${data}
                });
            }
        };
        componentOptions.data = data;

        ${methods.join('\n\n')}
    `;

    return output;
};
