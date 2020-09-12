const generate = require('@babel/generator').default;

module.exports = function (source, map) {
    const definition = JSON.parse(source);

    function walk(node, func, parent = null, index) {
        func(node, parent, index);
        const next = node.body || (node.consequent && node.consequent.body) || (node.alternate && node.alternate.body);
        next && next.forEach((child, index) => walk(child, func, node, index));
    }

    const methods = definition.logics.map((logic) => {
        walk(logic.definition, (node, parent, index) => {
            if (node.type === 'Start' || node.type === 'End') {
                node.type = 'Noop';
            } else if (node.type === 'Call')
                node.type = 'CallExpression';
            else if (node.type === 'CallMessageShow') {
                // console.log('STrt!!!')
                Object.assign(node, {
                    type: 'CallExpression',
                    callee: {
                        type: 'MemberExpression',
                        object: {
                            type: 'MemberExpression',
                            object: {
                                type: 'ThisExpression',
                            },
                            property: {
                                type: 'Identifier',
                                name: '$toast',
                            },
                            computed: false,
                        },
                        property: {
                            type: 'Identifier',
                            name: 'show',
                        },
                        computed: false,
                    },
                });
            }
        });

        const returnIdentifier = logic.definition.returns[0] ? logic.definition.returns[0].name : 'result';

        return `methods['${logic.name}'] = function (${logic.definition.params.map((param) => param.name).join(', ')}) {
            let ${returnIdentifier};

            ${generate({
        type: 'Program',
        body: logic.definition.body,
    }).code}

            return ${returnIdentifier};
        }`;
    });

    const output = `export default function (Component) {
        const definition = Component.options.__definition = ${source};
        const methods = Component.options.methods = Component.options.methods || {};
        
        ${methods.join('\n\n')}
    }`;

    this.callback(null, output, map);
    // console.log(output);
};
