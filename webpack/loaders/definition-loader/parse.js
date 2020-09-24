const generate = require('@babel/generator').default;
const babel = require('@babel/core');

function switchCase2If(cases) {
    const cas = cases.unshift();

    const result = {
        type: 'IfStatement',
        test: cas.test,
        consequent: {
            type: 'BlockStatement',
            body: cas.consequent,
        },
        alternate: null,
    };

    if (cases.length) {
        result.alternate = switchCase2If(cases);
    } else {
        result.alternate = {
            type: 'BlockStatement',
            body: cas.alternate,
        };
    }

    return result;
}

module.exports = function (source) {
    const definition = JSON.parse(source);

    function walk(node, func, parent = null, index) {
        func(node, parent, index);
        const next = (node.body && (Array.isArray(node.body) ? node.body : node.body.body)) || (node.consequent && (Array.isArray(node.consequent) ? node.consequent : node.consequent.body)) || (node.alternate && node.alternate.body);
        next && Array.isArray(next) && next.forEach((child, index) => walk(child, func, node, index));
        node.left && walk(node.left, func, node);
        node.right && walk(node.right, func, node);
        node.variables && walk(node.variables, func, node);
    }

    const dataMap = {};
    const data = (definition.variables || []).map((param) => {
        dataMap[param.name] = param.init || {};
        return param.name + `: ${param.init.value}`;
    }).join(',\n');

    const lifecycles = (definition.lifecycles || []).map((lifecycle) => `componentOptions['${lifecycle.name}'] = function () {
            return this.${lifecycle.definition}();
        }`);

    const methods = (definition.logics || []).map((logic) => {
        const returnIdentifier = logic.definition.returns[0] ? logic.definition.returns[0].name : 'result';

        walk(logic.definition, (node, parent, index) => {
            if (node.type === 'Start' || node.type === 'Comment') {
                node.type = 'Noop';
            } else if (node.type === 'End') {
                Object.assign(node, {
                    type: 'ReturnStatement',
                    argument: { type: 'Identifier', name: returnIdentifier },
                });
            } else if (node.type === 'Call')
                node.type = 'CallExpression';
            else if (node.type === 'Identifier') {
                if (dataMap[node.name])
                    node.name = 'this.' + node.name;
            } else if (node.type === 'CallMessageShow') {
                // console.log('STrt!!!')
                Object.assign(node, babel.parse(`this.$toast.show()`, { filename: 'file.js' }).program.body[0].expression, {
                    arguments: node.arguments,
                });
            } else if (node.type === 'CallDestination') {
                // console.log('STrt!!!')
                Object.assign(node, babel.parse(`this.$destination()`, { filename: 'file.js' }).program.body[0].expression, {
                    arguments: node.arguments,
                });
            } else if (node.type === 'CallGraphQL') {
                Object.assign(node, {
                    type: 'AwaitExpression',
                    argument: babel.parse(`this.$graphql.${node.action || 'query'}('${node.schemaRef}', '${node.resolverName}')`, { filename: 'file.js' }).program.body[0].expression,
                });
                if (node.variables) {
                    node.argument.arguments.push(node.variables);
                }
            } else if (node.type === 'WhileStatement') {
                if (Array.isArray) {
                    node.body = {
                        type: 'BlockStatement',
                        body: node.body,
                    };
                }
            } else if (node.type === 'SwitchStatement') {
                Object.assign(node, switchCase2If(node.cases));
                delete node.cases;
            } else if (node.type === 'ForEachStatement') {
                const forEach = babel.parse(`for (let ${node.index.name} = start - 1; ${node.index.name} < list.length; ${node.index.name}++) {
                    const ${node.item.name} = list[${node.index.name}];
                }`, { filename: 'file.js' }).program.body[0];

                forEach.init.declarations[0].init.left = node.start;
                forEach.test.right = node.end;
                forEach.body.body[0].declarations[0].init.object = node.each;
                forEach.body.body[0].declarations[0].init.property = node.index;
                forEach.body.body.push(...node.body);
                Object.assign(node, forEach);
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
            ${logic.definition.variables.length ? 'let ' + logic.definition.variables.map((variable) => variable.name).join(', ') + ';' : ''}
            let ${returnIdentifier};

            ${generate({
        type: 'Program',
        body: logic.definition.body,
    }).code}
        }`;
    });

    const output = `
        const methods = componentOptions.methods = componentOptions.methods || {};
        const computed = componentOptions.computed = componentOptions.computed || {};
        const data = function () {
            const oldData = componentOptions.data && componentOptions.data !== data ? componentOptions.data.call(this) : {};

            return Object.assign(oldData, {
                ${data}
            });
        };
        componentOptions.data = data;

        const meta = componentOptions.meta = componentOptions.meta || {};
        Object.assign(meta, {title: '${definition.title}', crumb: '${definition.crumb}'});

        ${lifecycles.join('\n\n')}

        ${methods.join('\n\n')}
    `;

    return output;
};
