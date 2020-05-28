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
};

