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
    const data = (definition.variables || []).map((variable) => {
        variable.init = variable.init || { type: 'StringLiteral', value: '' };
        dataMap[variable.name] = variable.init;
        return variable.name + `: ${generate(variable.init).code}`;
    }).join(',\n');

    const lifecycles = (definition.lifecycles || []).filter((lifecycle) => lifecycle.name).map((lifecycle) => `componentOptions['${lifecycle.name}'] = function () {
            return this.${lifecycle.definition}();
        }`);

    const methods = (definition.logics || []).map((logic) => {
        let returnObj = { type: 'Identifier', name: 'result', init: { type: 'Identifier', name: 'undefined' } };
        if (logic.definition.returns[0])
            returnObj = logic.definition.returns[0];

        walk(logic.definition, (node, parent, index) => {
            if (node.type === 'Start' || node.type === 'Comment') {
                node.type = 'Noop';
            } else if (node.type === 'End') {
                Object.assign(node, {
                    type: 'ReturnStatement',
                    argument: { type: 'Identifier', name: returnObj.name },
                });
            } else if (node.type === 'CallLogic') {
                const getArgument = () => node.arguments.map((argument) => {
                    let name = argument.name;
                    if (dataMap[name]) {
                        name = `this.${name}`;
                    }
                    return name;
                });
                Object.assign(node, {
                    type: 'AwaitExpression',
                    argument: babel.parse(`this.${node.calleeCode}(${getArgument().join(',')})`,
                        { filename: 'file.js' }).program.body[0].expression,
                });
            } else if (node.type === 'CallInterface') {
                const key = node.interfaceKey;
                const arr = key.split('/');
                const getParams = (key) => {
                    if (key === 'body') {
                        const body = (node.params || []).find((param) => param.in === key);
                        if (body) {
                            let value = generate(body.value).code;
                            if (dataMap[value])
                                value = `this.${value}`;
                            return value || undefined;
                        } else
                            return undefined;
                    } else {
                        return (node.params || [])
                            .filter((param) => param.in === key)
                            .map((param) => {
                                let value = generate(param.value).code;
                                if (dataMap[value])
                                    value = `this.${value}`;
                                return `${param.name}: ${value}`;
                            });
                    }
                };
                Object.assign(node, {
                    type: 'AwaitExpression',
                    argument: babel.parse(`this.$services['${arr[0]}']['${arr[1]}']({
                        path: {
                            ${getParams('path').join(',\n')}
                        },
                        query: {
                            ${getParams('query').join(',\n')}
                        },
                        body: ${getParams('body')},
                    })`, { filename: 'file.js' }).program.body[0].expression,
                });

                // const objectExpression = node.argument.arguments[0];
                // if (node.query) {
                //     objectExpression.properties[1].properties[1] = node.query;
                // }
                // if (node.body) {
                //     objectExpression.properties[1] = node.body;
                // }
            } else if (node.type === 'CallFlow') {
                let params = '';
                const variables = generate(node.variables).code || undefined;
                if (node.action === 'start') {
                    params = `{
                        body: {
                            processDefinitionKey: '${node.processDefinitionKey}',
                            returnVariables: true,
                            variables: ${variables},
                        }
                    }`;
                } else if (node.action === 'complete') {
                    params = `{
                        path: {
                            taskId: '${generate(node.taskId).node || undefined}',
                        },
                        body: {
                            action: 'complete',
                            variables: ${variables},
                        }
                    }`;
                } else if (node.action === 'getList') {
                    params = `{
                        body: {
                            processDefinitionKey: '${node.processDefinitionKey}',
                            processInstanceId: ${generate(node.processInstanceId).code || undefined},
                            includeProcessVariables: true,
                        },
                    }`;
                } else if (node.action === 'get') {
                    params = `{
                        path: {
                            taskId: '${generate(node.taskId).node || undefined}',
                        },
                    }`;
                } else if (node.action === 'getProcessInstanceList') {
                    params = `{
                        body: {
                            processDefinitionKey: '${node.processDefinitionKey}',
                            includeProcessVariables: true,
                        }
                    }`;
                } else if (node.action === 'getProcessInstance') {
                    params = `{
                        path: {
                            processInstanceId: '${generate(node.processInstanceId).node || undefined}',
                        },
                    }`;
                } else if (node.action === 'updateVariables') {
                    params = `{
                        path: {
                            processInstanceId: '${generate(node.processInstanceId).node || undefined}',
                        },
                        body: ${variables},
                    }`;
                }

                Object.assign(node, {
                    type: 'AwaitExpression',
                    argument: babel.parse(`this.$services.process.${node.action}(${params})`, { filename: 'file.js' }).program.body[0].expression,
                });
            } else if (node.type === 'Identifier') {
                if (dataMap[node.name])
                    node.name = 'this.' + node.name;
            } else if (node.type === 'CallMessageShow') {
                Object.assign(node, babel.parse(`this.$toast.show()`, { filename: 'file.js' }).program.body[0].expression, {
                    arguments: node.arguments,
                });
            } else if (node.type === 'Destination') {
                const params = (node.params || []).filter((param) => param.key && param.value).map((param) => {
                    if (param.value.type === 'Identifier') {
                        let name = param.value.name;
                        if (dataMap[name])
                            name = 'this.' + name;
                        return param.key.name + '=${' + name + '}';
                    } else {
                        return param.key.name + '=' + param.value.value;
                    }
                });
                const url = '`/' + node.page + node.url + '?' + params.join('&') + '`';
                Object.assign(node, babel.parse(`this.$destination(${url})`, { filename: 'file.js' }).program.body[0].expression);
            } else if (node.type === 'CallGraphQL') {
                const getParams = (key) => {
                    const data = (node.params || []); // .filter((param) => param.in === key);
                    return data.map((param) => {
                        let value = generate(param.value).code;
                        if (dataMap[value]) {
                            value = `this.${value}`;
                        }
                        // if (key === 'body')
                        //     return value || 'undefined';
                        // else
                        return `${param.name}: ${value}`;
                    });
                };

                Object.assign(node, {
                    type: 'AwaitExpression',
                    argument: babel.parse(`this.$graphql.${node.action || 'query'}('${node.schemaRef}', '${node.resolverName}', {
                        ${getParams('query').join(',\n')}
                    })`, { filename: 'file.js' }).program.body[0].expression,
                });
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
            ${logic.definition.variables.length ? 'let ' + logic.definition.variables.map((variable) => variable.name + ' = ' + (generate(variable.init).code || '')).join(';\n') + '' : ''}
            let ${returnObj.name} = ${generate(returnObj.init).code || ''};

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
        Object.assign(meta, {title: ${JSON.stringify(definition.title)}, crumb: ${JSON.stringify(definition.crumb)} });

        ${lifecycles.join('\n\n')}

        ${methods.join('\n\n')}
    `;

    return output;
};
