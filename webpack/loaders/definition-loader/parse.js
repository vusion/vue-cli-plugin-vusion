const generate = require('@babel/generator').default;
const babel = require('@babel/core');
const { TransforClientQuery: genQuery } = require('apollo-plugin-loader');

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
        let next = (node.body && (Array.isArray(node.body) ? node.body : node.body.body));
        next && Array.isArray(next) && next.forEach((child, index) => walk(child, func, node, index));
        next = (node.consequent && (Array.isArray(node.consequent) ? node.consequent : node.consequent.body));
        next && Array.isArray(next) && next.forEach((child, index) => walk(child, func, node, index));
        next = (node.alternate && node.alternate.body);
        next && Array.isArray(next) && next.forEach((child, index) => walk(child, func, node, index));
        next = node.arguments;
        next && Array.isArray(next) && next.forEach((child, index) => walk(child, func, node, index));
        next && Array.isArray(next) && next.forEach((child, index) => walk(child, func, node, index));

        node.left && walk(node.left, func, node);
        node.right && walk(node.right, func, node);
        node.variables && walk(node.variables, func, node);
    }

    const dataMap = {};
    const globalDataMap = {
        $route: true,
        $auth: true,
        $refs: true,
    };

    const paramsData = (definition.params || []).map((param) => {
        param.init = param.init || { type: 'StringLiteral', value: '' };
        dataMap[param.name] = param.init;
        if (param.schema.type === 'boolean')
            return param.name + `: this.$route.query.hasOwnProperty('${param.name}') || this.$route.query.${param.name} === 'true'`;
        else if (param.schema.type === 'integer')
            return param.name + `: parseInt(this.$route.query.${param.name})`;
        else if (param.schema.type === 'number')
            return param.name + `: parseFloat(this.$route.query.${param.name})`;
        else if (param.schema.$ref)
            return param.name + `: this.$utils.tryJSONParse(this.$route.query.${param.name})`;
        else
            return param.name + `: this.$route.query.${param.name}`;
    }).join(',\n').trim();
    const variablesData = (definition.variables || []).map((variable) => {
        variable.init = variable.init || { type: 'StringLiteral', value: '' };
        dataMap[variable.name] = variable.init;
        return variable.name + `: ${generate(variable.init).code || undefined}`;
    }).join(',\n').trim();

    function checkThis(node) {
        if (node.type === 'Identifier') {
            if (dataMap[node.name] || globalDataMap[node.name])
                node.name = 'this.' + node.name;
        } else if (node.type === 'MemberExpression') {
            return checkThis(node.object);
        }
    }
    function safeGenerate(node, func) {
        if (!node)
            return undefined;
        checkThis(node);
        const code = generate(node).code;
        return code || undefined;
    }

    const lifecycles = (definition.lifecycles || []).filter((lifecycle) => lifecycle.name).map((lifecycle) => `componentOptions['${lifecycle.name}'] = function () {
            return this.${lifecycle.definition}();
        }`);

    const methods = (definition.logics || []).map((logic) => {
        let returnObj = { type: 'Identifier', name: 'result', init: { type: 'Identifier', name: 'undefined' } };
        if (logic.definition.returns[0])
            returnObj = logic.definition.returns[0];

        const parseFunc = (node, parent, index) => {
            if (node.type === 'Start' || node.type === 'Comment') {
                node.type = 'Noop';
            } else if (node.type === 'End') {
                Object.assign(node, {
                    type: 'ReturnStatement',
                    argument: { type: 'Identifier', name: returnObj.name },
                });
            } else if (node.type === 'Identifier' || node.type === 'MemberExpression') {
                checkThis(node);
            } else if (node.type === 'CallLogic') {
                const getArgument = () => node.arguments.map((argument) => safeGenerate(argument));
                Object.assign(node, {
                    type: 'AwaitExpression',
                    argument: babel.parse(`this.${node.calleeCode}(${getArgument().join(',')})`,
                        { filename: 'file.js' }).program.body[0].expression,
                });
            } else if (node.type === 'BuildInFunction') {
                // 参数
                const getParams = () =>
                    // 函数参数有固定顺序的
                    (node.params || [])
                        .map((param) => {
                            // 参数如果是内置对象，继续调用 walk 转化，如果是其他类型再针对性的转化，比如 CallInterface 之类的，也可以走 walk
                            if (param.value.type === 'BuildInFunction') {
                                return walk(param.value, parseFunc);
                            }

                            const value = safeGenerate(param.value);
                            if (!value) {
                                return 'null';
                            } else {
                                return `${value}`;
                            }
                        });
                // 调用表达式
                Object.assign(node, babel.parse(`this.$utils['${node.interfaceKey}'](${(getParams() || []).join(',\n')})`, { filename: 'file.js' }).program.body[0].expression);
            } else if (node.type === 'CallInterface') {
                const key = node.interfaceKey || '';
                const arr = key.split('/');
                const getParams = (key) => {
                    // 过滤掉 null 的 param
                    const nodeParams = (node.params || []).filter((param) => (param !== null && param !== 'null' && param !== ''));
                    if (key === 'body') {
                        const body = (nodeParams || [])
                            .find((param) => param.in === key);
                        if (body) {
                            return safeGenerate(body.value);
                        }
                        return '{}';
                    } else {
                        return nodeParams
                            .filter((param) => param.in === key)
                            .map((param) => {
                                const value = safeGenerate(param.value);
                                return `${param.name}: ${value}`;
                            });
                    }
                };
                // 如果是 interface 判断接口参数类型window.location.href
                Object.assign(node, {
                    type: 'AwaitExpression',
                    argument: babel.parse(`this.$services['${arr[0]}']['${arr[1]}']({
                        config: {
                            download: ${!!(node.interfaceKey.indexOf('export') > -1)},
                        },
                        path: {
                            ${getParams('path').join(',\n')}
                        },
                        query: {
                            ${getParams('query').join(',\n')}
                        },
                        body: ${getParams('body') || '{}'},
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
                const variables = safeGenerate(node.variables);
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
                            taskId: ${safeGenerate(node.taskId)},
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
                            processInstanceId: ${safeGenerate(node.processInstanceId)},
                            includeProcessVariables: true,
                            sort: 'startTime',
                            order: 'desc',
                        },
                    }`;
                } else if (node.action === 'get') {
                    params = `{
                        path: {
                            taskId: '${safeGenerate(node.taskId)}',
                        },
                    }`;
                } else if (node.action === 'getProcessInstanceList') {
                    params = `{
                        body: {
                            processDefinitionKey: '${node.processDefinitionKey}',
                            includeProcessVariables: true,
                            sort: 'startTime',
                            order: 'desc',
                        }
                    }`;
                } else if (node.action === 'getProcessInstance') {
                    params = `{
                        path: {
                            processInstanceId: ${safeGenerate(node.processInstanceId)},
                        },
                    }`;
                } else if (node.action === 'updateVariables') {
                    params = `{
                        path: {
                            processInstanceId: ${safeGenerate(node.processInstanceId)},
                        },
                        body: ${variables || '{}'},
                    }`;
                }

                Object.assign(node, {
                    type: 'AwaitExpression',
                    argument: babel.parse(`this.$services.process.${node.action}(${params})`, { filename: 'file.js' }).program.body[0].expression,
                });
            } else if (node.type === 'CallMessageShow') {
                Object.assign(node, babel.parse(`this.$toast.show()`, { filename: 'file.js' }).program.body[0].expression, {
                    arguments: node.arguments,
                });
            } else if (node.type === 'CallConsoleLog') {
                Object.assign(node, babel.parse(`console.log()`, { filename: 'file.js' }).program.body[0].expression, {
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
                const getParams = () => {
                    const data = (node.params || []); // .filter((param) => param.in === key);
                    const result = [];
                    // 目前主要 id，如果字段多了之后会有严格的顺序要求， 并且 path 里面不能使用名字为 query，body，这两个参数作为需要特殊处理的 key
                    const pathparams = data.filter((param) => param.in === 'path');
                    if (pathparams.length > 0) {
                        pathparams.forEach((param) => {
                            const value = safeGenerate(param.value);
                            result.push(`${param.name}: ${value}`);
                        });
                    }

                    const queryparams = data.filter((param) => param.in === 'query');
                    if (queryparams.length > 0) {
                        const queryValue = queryparams.map((param) => {
                            const value = safeGenerate(param.value);
                            console.info('param zxy', value);
                            return `${param.name}:${value}`;
                        });
                        // key：value 转化成 queryString
                        result.push(`query: { ${queryValue.join(',\n')} }`);
                    }

                    const bodyparams = data.filter((param) => param.in === 'body');
                    if (bodyparams.length > 0) {
                        const bodyValue = bodyparams.map((param) => {
                            const value = safeGenerate(param.value);
                            return `${param.name}:${value}`;
                        });
                        // 如果是 body 需要转化成对象
                        result.push(`body: {
                            ${bodyValue.join(',\n')}
                        }`);
                    }
                    // 最后再把按照 key 组装后的结果返回给页面
                    return result;
                };

                const getOperationName = (schemaRef = '', name = '') => {
                    const arr = schemaRef.split('/');
                    const entityName = arr[3];
                    // 处理全局查询的单复数问题
                    const singlename = name.indexOf('getAll') > -1 ? `getAll${entityName}` : name;
                    arr.pop();
                    arr.push(singlename);
                    arr.shift();
                    return arr.join('_');
                };

                node.operationName = getOperationName(node.schemaRef, node.resolverName);
                const graphqlClient = node.querySchemaMap ? genQuery(node) : `query test{}`;
                console.info('graphqlClient', graphqlClient);
                Object.assign(node, {
                    type: 'AwaitExpression',
                    argument: babel.parse(`this.$graphql.${node.action || 'query'}('${node.schemaRef}', '${node.operationName}', ${'`' + `${graphqlClient}` + '`'}, {
                        ${getParams().join(',\n')}
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
        };

        walk(logic.definition, parseFunc);

        console.info('JSON generate:', JSON.stringify(logic.definition.body));

        return `methods['${logic.name}'] = async function (${logic.definition.params.map((param) => param.name).join(', ')}) {
            ${logic.definition.variables.length ? 'let ' + logic.definition.variables.map((variable) => variable.name + ' = ' + (safeGenerate(variable.init))).join(';\n') + '' : ''}
            let ${returnObj.name} = ${safeGenerate(returnObj.init)};

            ${generate({
        type: 'Program',
        body: logic.definition.body,
    }).code}
        }`;
    });

    const output = `
        const methods = componentOptions.methods = componentOptions.methods || {};
        const computed = componentOptions.computed = componentOptions.computed || {};
        const oldDataFunc = componentOptions.data;
        const data = function () {
            const oldData = oldDataFunc ? oldDataFunc.call(this) : {};
            return Object.assign(oldData, {
                ${paramsData ? paramsData + ',' : ''}
                ${variablesData}
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
