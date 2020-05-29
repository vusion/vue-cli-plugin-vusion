const TemplateHandler = require('vusion-api/out/fs/TemplateHandler').default;

/**
 * 该方法可以在两端(node, browser)运行
 */
exports.compilerPlugin = function compilerPlugin(ast, options, compiler) {
    const traverse = TemplateHandler.prototype.traverse;
    traverse.call({ ast }, (info) => {
        const el = info.node;
        el.nodePath = info.route;
        if (el.type !== 1)
            return;

        // 没有特别好的方法，scopeId 是 vue.runtime 实现的，vusion-node-path 目前只能通过添加属性解决
        el.attrsList.push({ name: 'vusion-node-path', value: info.route });
        el.attrsMap['vusion-node-path'] = info.route;
        const attr = { name: 'vusion-node-path', value: JSON.stringify(info.route) };
        if (!el.attrs)
            el.attrs = [];
        el.attrs.push(attr);
        el.rawAttrsMap['vusion-node-path'] = attr;
        // 为了添加属性，只能全部开启 false
        el.plain = false;
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
                if (el.attrsMap.direction === 'vertical')
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

