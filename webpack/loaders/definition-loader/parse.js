const generate = require('@babel/generator').default;
const babel = require('@babel/core');
const { TransforClientQuery: genQuery } = require('apollo-plugin-loader');

function switchCase2If(cases) {
    const cas = cases.shift();

    const result = {
        type: 'IfStatement',
        test: cas.test,
        consequent: {
            type: 'BlockStatement',
            body: cas.consequent || [],
        },
        alternate: null,
    };

    if (cases.length) {
        result.alternate = switchCase2If(cases);
    } else {
        return {
            type: 'BlockStatement',
            body: cas.consequent || [],
        };
    }

    return result;
}

module.exports = function (source) {
    const definition = JSON.parse(source);

    function traverse(
        node,
        func,
        parent,
        index,
    ) {
        func(node, parent, index);
        Object.values(node).forEach((value) => {
            if (Array.isArray(value)) {
                value.forEach((child, index) => child && traverse(child, func, node, index));
            } else if (typeof value === 'object')
                value && traverse(value, func, node, index);
        });
    }

    const dataMap = {};
    const globalDataMap = {
        $route: true,
        $global: true,
        $refs: true,
    };

    const paramsData = (definition.params || []).map((param) => {
        // pass schema to genInitData function, transform init realtime after datatypes changed
        param.init = babel.parse('this.$genInitFromSchema(' + JSON.stringify(param.schema) + ')', { filename: 'file.js' }).program.body[0].expression || { type: 'StringLiteral', value: '' };
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
        variable.init = babel.parse('this.$genInitFromSchema(' + JSON.stringify(variable.schema) + ')', { filename: 'file.js' }).program.body[0].expression
         || { type: 'StringLiteral', value: '' };
        dataMap[variable.name] = variable.init;
        return variable.name + `: ${generate(variable.init).code || undefined}`;
    }).join(',\n').trim();

    function checkThis(node) {
        if (!node)
            return;
        if (node.type === 'Identifier') {
            if (dataMap[node.name] || globalDataMap[node.name])
                node.name = 'this.' + node.name;
        } else if (node.type === 'MemberExpression') {
            return checkThis(node.object);
        }
    }
    function safeGenerate(node) {
        if (!node)
            return undefined;
        checkThis(node);
        const code = generate(node).code;
        return code || undefined;
    }
    function safeKey(key) {
        if (/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(key))
            return key;
        else
            return `['${key}']`;
    }

    const lifecycles = (definition.lifecycles || []).filter((lifecycle) => lifecycle.name).map((lifecycle) => `componentOptions['${lifecycle.name}'] = function () {
            return this.${lifecycle.definition}();
        }`);

    const methods = (definition.logics || []).map((logic) => {
        let returnObj = { type: 'Identifier', name: 'result', init: { type: 'Identifier', name: 'undefined' } };
        if (logic.definition.returns[0])
            returnObj = logic.definition.returns[0];

        traverse(logic.definition, (node, parent, index) => {
            if (node.type === 'Start' || node.type === 'Comment') {
                node.type = 'Noop';
            } else if (node.type === 'End') {
                Object.assign(node, {
                    type: 'ReturnStatement',
                    argument: { type: 'Identifier', name: returnObj.name },
                });
            } else if (node.type === 'Identifier' && node.level === 'expressionNode') {
                if (!(parent && parent.type === 'MemberExpression' && node === parent.property || node.name.startsWith('this.')))
                    checkThis(node);
            } else if (node.type === 'AssignmentExpression') {
                checkThis(node.left);
                checkThis(node.right);
            } else if (node.type === 'CallLogic') {
                const getArgument = () => node.arguments.map((argument) => safeGenerate(argument));
                Object.assign(node, {
                    type: 'AwaitExpression',
                    argument: babel.parse(`this.${node.calleeCode}(${getArgument().join(',')})`,
                        { filename: 'file.js' }).program.body[0].expression,
                });
            } else if (node.type === 'BuiltInFunction') {
                // 调用表达式
                Object.assign(node, babel.parse(`this.$utils['${node.calleeCode}']()`, { filename: 'file.js' }).program.body[0].expression, {
                    arguments: (node.params || []).map((param) => param.value),
                });
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
                                return `${safeKey(param.name)}: ${value}`;
                            });
                    }
                };
                // 如果是 interface 判断接口参数类型window.location.href
                Object.assign(node, {
                    type: 'AwaitExpression',
                    argument: babel.parse(`this.$services['${arr[0]}']['${arr[1]}']({
                        config: {
                            download: ${node.interfaceKey.includes('export')},
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
                const bodyParams = (node.params || [])
                    .filter((param) => param.in === undefined) // 放在body内部的参数
                    .filter((param) => safeGenerate(param.value) !== undefined)
                    .map((param) => `${safeKey(param.name)}: ${safeGenerate(param.value)}`)
                    .join(',\n');

                const getObj = (type) => (node.params || [])
                    .filter((param) => param.in === type)
                    .reduce((obj, param) => {
                        const key = safeKey(param.name);
                        const value = safeGenerate(param.value);
                        obj[key] = value;
                        return obj;
                    }, {});
                const pathObj = getObj('path');
                const bodyObj = getObj('body');

                let params = '';
                const variables = safeGenerate(node.variables);
                if (node.action === 'start') {
                    params = `{
                        body: {
                            processDefinitionKey: '${node.processDefinitionKey}',
                            returnVariables: true,
                            variables: ${variables},
                            ${bodyParams}
                        }
                    }`;
                } else if (node.action === 'complete') {
                    params = `{
                        path: {
                            taskId: ${pathObj.taskId || safeGenerate(node.taskId)},
                        },
                        body: {
                            action: 'complete',
                            variables: ${variables},
                            ${bodyParams}
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
                            finished: ${node.finished},
                            ${bodyParams}
                        },
                    }`;
                } else if (node.action === 'get') {
                    params = `{
                        path: {
                            taskId: '${pathObj.taskId || safeGenerate(node.taskId)}',
                        },
                    }`;
                } else if (node.action === 'getProcessInstanceList') {
                    params = `{
                        body: {
                            processDefinitionKey: '${node.processDefinitionKey}',
                            includeProcessVariables: true,
                            sort: 'startTime',
                            order: 'desc',
                            finished: ${node.finished},
                            startedBy: ${safeGenerate(node.startedBy)},
                            ${bodyParams}
                        }
                    }`;
                } else if (node.action === 'getProcessInstance') {
                    params = `{
                        path: {
                            processInstanceId: ${pathObj.processInstanceId || safeGenerate(node.processInstanceId)},
                        },
                    }`;
                } else if (node.action === 'updateVariables') {
                    params = `{
                        path: {
                            processInstanceId: ${pathObj.processInstanceId || safeGenerate(node.processInstanceId)},
                        },
                        body: ${bodyObj.variables || variables || '{}'},
                    }`;
                }

                Object.assign(node, {
                    type: 'AwaitExpression',
                    argument: babel.parse(`this.$services.process.${node.action}(${params})`, { filename: 'file.js' }).program.body[0].expression,
                });
            } else if (node.type === 'CallMessageShow') {
                checkThis(node.arguments[0]);
                Object.assign(node, babel.parse(`this.$toast.show()`, { filename: 'file.js' }).program.body[0].expression, {
                    arguments: node.arguments,
                });
            } else if (node.type === 'CallConsoleLog') {
                checkThis(node.arguments[0]);
                Object.assign(node, babel.parse(`console.log()`, { filename: 'file.js' }).program.body[0].expression, {
                    arguments: node.arguments,
                });
            } else if (node.type === 'Destination') {
                const params = (node.params || []).filter((param) => param.key && param.value).map((param) => {
                    const value = safeGenerate(param.value);
                    if (param.value.type === 'StringLiteral' || param.value.type === 'NumericLiteral') {
                        return safeKey(param.key.name) + '=' + param.value.value;
                    } else {
                        return safeKey(param.key.name) + '=${' + value + '}';
                    }
                });
                let url = node.url;
                if (params.length) {
                    url = '`' + url + '?' + params.join('&') + '`';
                } else {
                    url = '`' + url + '`';
                }
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
                            result.push(`${safeKey(param.name)}: ${value}`);
                        });
                    }

                    const queryparams = data.filter((param) => param.in === 'query');
                    if (queryparams.length > 0) {
                        const queryValue = queryparams.map((param) => {
                            const value = safeGenerate(param.value);
                            return `${safeKey(param.name)}:${value}`;
                        });
                        // key：value 转化成 queryString
                        result.push(`query: { ${queryValue.join(',\n')} }`);
                    }

                    const bodyparams = data.filter((param) => param.in === 'body');
                    if (bodyparams.length > 0) {
                        const bodyValue = bodyparams.map((param) => {
                            const value = safeGenerate(param.value);
                            return `${safeKey(param.name)}:${value}`;
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
                    const singlename = name.includes('getAll') ? `getAll${entityName}` : name;
                    arr.pop();
                    arr.push(singlename);
                    arr.shift();
                    return arr.join('_');
                };

                node.operationName = getOperationName(node.schemaRef, node.resolverName);
                const graphqlClient = node.querySchemaMap ? genQuery(node) : `query test{}`;
                Object.assign(node, {
                    type: 'AwaitExpression',
                    argument: babel.parse(`this.$graphql.${node.action || 'query'}('${node.schemaRef}', '${node.operationName}', \`${graphqlClient}\`, {
                        ${getParams().join(',\n')}
                    })`, { filename: 'file.js' }).program.body[0].expression,
                });
            } else if (node.type === 'IfStatement') {
                checkThis(node.test);
            } else if (node.type === 'WhileStatement') {
                checkThis(node.test);
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

                checkThis(node.start);
                checkThis(node.end);
                forEach.init.declarations[0].init.left = node.start;
                forEach.test.right = node.end;
                forEach.body.body[0].declarations[0].init.object = node.each;
                forEach.body.body[0].declarations[0].init.property = node.index;
                forEach.body.body.push(...node.body);
                Object.assign(node, forEach);
            } else if (node.type === 'JSONSerialize') {
                checkThis(node.arguments[0]);
                Object.assign(node, babel.parse(`JSON.stringify()`, { filename: 'file.js' }).program.body[0].expression, {
                    arguments: node.arguments,
                });
            } else if (node.type === 'JSONDeserialize') {
                checkThis(node.arguments[0]);
                Object.assign(node, babel.parse(`JSON.parse()`, { filename: 'file.js' }).program.body[0].expression, {
                    arguments: node.arguments,
                });
            } else if (node.type === 'RaiseException') {
                checkThis(node.arguments[0]);
                const throwStatement = babel.parse(`throw new Error()`, { filename: 'file.js' }).program.body[0];
                throwStatement.argument.arguments = node.arguments;
                Object.assign(node, throwStatement);
            } else if (node.type === 'JSBlock') {
                Object.assign(node, babel.parse(
                    `{
                        const jsBlock_${index} = async () => {
                            with(this) {
                                ${node.code}
                            }
                        }
                    
                        await jsBlock_${index}();
                    }`, {
                        filename: 'file.js',
                        parserOpts: {
                            allowAwaitOutsideFunction: true,
                        },
                    },
                ).program.body[0]);
            }
        });

        console.info('JSON generate:', JSON.stringify(logic.definition.body));

        return `methods['${logic.name}'] = async function (${logic.definition.params.map((param) => param.name).join(', ')}) {
            ${logic.definition.variables.length ? logic.definition.variables.map((variable) => 'let ' + variable.name + ' = '
                + safeGenerate(babel.parse('this.$genInitFromSchema(' + JSON.stringify(variable.schema) + ')', { filename: 'file.js' }).program.body[0].expression)).join(';\n') + '' : ''}
            let ${returnObj.name} = ${
    safeGenerate(babel.parse('this.$genInitFromSchema(' + JSON.stringify(returnObj.schema) + ')', { filename: 'file.js' }).program.body[0].expression)
};
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
        Object.assign(meta, {
            title: ${JSON.stringify(definition.title)},
            crumb: ${JSON.stringify(definition.crumb)},
            first: ${JSON.stringify(definition.first)},
        });

        ${lifecycles.join('\n\n')}

        ${methods.join('\n\n')}
    `;

    return output;
};
