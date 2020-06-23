const TemplateHandler = require('vusion-api/out/fs/TemplateHandler').default;

/**
 * 该方法可以在两端(node, browser)运行
 */
exports.compilerPlugin = function compilerPlugin(ast, options, compiler) {
    const traverse = TemplateHandler.prototype.traverse;

    traverse.call({ ast }, (info) => {
        const el = info.node;
        el.nodePath = info.route;
        if (el.type !== 1) {
            return;

            // el.type = 1;
            // el.tag = 'd-text';
            // el.attrsList = [];
            // el.attrsMap = {};
            // el.attrs = [];
            // el.rawAttrsMap = {};
            // el.children = [];
        }

        if (!el.attrs)
            el.attrs = [];

        // 没有特别好的方法，scopeId 是 vue.runtime 实现的，vusion-node-path 目前只能通过添加属性解决
        if (!el.attrsMap.hasOwnProperty('vusion-node-path') && !el.attrsMap.hasOwnProperty(':vusion-node-path')) {
            el.attrsList.push({ name: 'vusion-node-path', value: info.route });
            el.attrsMap['vusion-node-path'] = info.route;
            const attr = { name: 'vusion-node-path', value: JSON.stringify(info.route) };
            el.attrs.push(attr);
            el.rawAttrsMap['vusion-node-path'] = attr;
            // 为了添加属性，只能全部开启 false
            el.plain = false;
        }
        // 打包之后
        // if (!el.attrsMap.hasOwnProperty('vusion-scope-id') && !el.attrsMap.hasOwnProperty(':vusion-scope-id')) {
        //     const shortScopeId = options.scopeId.replace(/^data-v-/, '');
        //     el.attrsList.push({ name: 'vusion-scope-id', value: shortScopeId });
        //     el.attrsMap['vusion-scope-id'] = shortScopeId;
        //     const attr = { name: 'vusion-scope-id', value: JSON.stringify(shortScopeId) };
        //     el.attrs.push(attr);
        //     el.rawAttrsMap['vusion-scope-id'] = attr;
        //     // 为了添加属性，只能全部开启 false
        //     el.plain = false;
        // }
    });

    traverse.call({ ast }, (info) => {
        const el = info.node;
        if (el.tag === 'u-linear-layout' || el.tag === 'u-grid-layout-column') {
            const children = el.children = el.children || [];

            const subOptions = {
                scopeId: options.scopeId,
                whitespace: 'condense',
            };

            let display = 'block';
            if (el.tag === 'u-linear-layout') {
                if (el.attrsMap.direction !== 'vertical')
                    display = 'inline';
            }

            const tmp = compiler.compile(`
    <div>
    <d-slot tag="${el.tag}" display="${display}" :nodeInfo="{ scopeId: '${options.scopeId}', nodePath: '${el.nodePath}' }"></d-slot>
    </div>`, subOptions).ast;
            children.push(...tmp.children);
        }
    });

    const depthTraverse = (ast) => {
        const stack = [];
        stack.push(ast.ast);
        let node;
        while (stack.length) {
            node = stack.pop();
            if ((node.tag && node.tag.startsWith('d-')) || (node.attrsMap && node.attrsMap.class && node.attrsMap.class.startsWith('d-')))
                continue;
            let children = node.children = node.children || [];
            if (node.scopedSlots) {
                children = children.concat(Object.keys(node.scopedSlots).map((key) => node.scopedSlots[key]));
            }
            const texts = children.filter((item) => item.type === 3);
            if (texts.length) {
                texts.forEach((text) => {
                    const tmp = compiler.compile(`<d-text text="${text.text}" nodePath="${text.nodePath}" parentNodePath="${node.nodePath}"></d-text>`).ast;
                    tmp.parent = node;
                    Object.assign(text, tmp);
                });
            }

            // 表达式处添加占位，用于添加节点操作
            const expressions = children.filter((item) => item.type === 2);
            if (expressions.length) {
                expressions.forEach((expression) => {
                    const tmp = compiler.compile(`<d-placeholder nodePath="${expression.nodePath}" parentNodePath="${node.nodePath}">${expression.text}</d-placeholder>`).ast;
                    tmp.parent = node;
                    Object.assign(expression, tmp);
                });
            }

            if (children.length) {
                for (let i = children.length - 1; i >= 0; i--) {
                    if (children[i].tag && !children[i].tag.startsWith('d-'))
                        stack.push(children[i]);
                }
            }
        }
    };

    if (options && !/.\/*d-.*/.test(options.filename)) {
        depthTraverse({ ast });
    }

/* <d-skeleton ${el.attrsMap.direction === 'vertical' ? '' : 'display="inline"'}></d-skeleton>
<d-skeleton ${el.attrsMap.direction === 'vertical' ? '' : 'display="inline"'}></d-skeleton> */
};

