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
            // if (el.parent && el.parent.tag === 'd-text')
            //     return;

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
        if (!el.attrsMap.hasOwnProperty('vusion-scope-id') && !el.attrsMap.hasOwnProperty(':vusion-scope-id')) {
            const shortScopeId = options.scopeId.replace(/^data-v-/, '');
            el.attrsList.push({ name: 'vusion-scope-id', value: shortScopeId });
            el.attrsMap['vusion-scope-id'] = shortScopeId;
            const attr = { name: 'vusion-scope-id', value: JSON.stringify(shortScopeId) };
            el.attrs.push(attr);
            el.rawAttrsMap['vusion-scope-id'] = attr;
            // 为了添加属性，只能全部开启 false
            el.plain = false;
        }
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

/* <d-skeleton ${el.attrsMap.direction === 'vertical' ? '' : 'display="inline"'}></d-skeleton>
<d-skeleton ${el.attrsMap.direction === 'vertical' ? '' : 'display="inline"'}></d-skeleton> */
};

