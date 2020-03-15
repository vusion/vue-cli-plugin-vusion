const compiler = require('vue-template-compiler');
const vusion = require('vusion-api');

// function addSlotHolder(el) {
//     el.parent
// }

const compilerModule = {
    transformNode(el, options) {
        // if (el.tag === 'slot')
        //     debugger;
    },
    postTransformNode(el, options) {
        if (!options.vueFile.fullPath.includes('test'))
            return;
        console.log(el.tag);
        if (options.vueFile.tagName.startsWith('d-'))
            return;

        // // 从根节点处理
        // if (el.parent)
        //     return;
        if (el.tag === 'slot') {
            // const children = el.parent.children;
            // const index = children.indexOf(el);

            // const ast = compiler.compile(`<div class="vusion-designer-slot"></div>`).ast;
            // children.splice(index + 1, 0, ast);
        } else if (el.tag === 'div') {
            if (!el.children)
                el.children = [];
            const children = el.children;

            const ast = compiler.compile(`<d-slot></d-slot>`).ast;
            children.push(ast);
        } else if (el.tag === 'u-linear-layout') {
            if (!el.children)
                el.children = [];
            const children = el.children;

            const ast = compiler.compile(`
<div>
<d-slot tag="u-linear-layout"></d-slot>
<d-skeleton></d-skeleton>
<d-skeleton></d-skeleton>
</div>`).ast;
            children.push(...ast.children);
        }

        // if (el.tag === 'slot')
        //     debugger;
    },
};

module.exports = function compilerPlugin(ast, options) {
    if (!options.vueFile.fullPath.includes('test.vue'))
        return;
    if (options.vueFile.tagName.startsWith('d-'))
        return;
    const traverse = vusion.fs.TemplateHandler.prototype.traverse;
    traverse.call({ ast }, (nodePath) => {
        const el = nodePath.node;
        console.log(el.tag);
        // // 从根节点处理
        // if (el.parent)
        //     return;
        if (el.tag === 'slot') {
            // const children = el.parent.children;
            // const index = children.indexOf(el);

            // const ast = compiler.compile(`<div class="vusion-designer-slot"></div>`).ast;
            // children.splice(index + 1, 0, ast);
        } else if (el.tag === 'div') {
            const children = el.children = el.children || [];

            const ast = compiler.compile(`<d-slot></d-slot>`).ast;
            children.push(ast);
        } else if (el.tag === 'u-linear-layout') {
            const children = el.children = el.children || [];

            const ast = compiler.compile(`
<div>
<d-slot tag="u-linear-layout" ${el.attrsMap.direction === 'vertical' ? '' : 'display="inline"'}></d-slot>
<d-skeleton ${el.attrsMap.direction === 'vertical' ? '' : 'display="inline"'}></d-skeleton>
<d-skeleton ${el.attrsMap.direction === 'vertical' ? '' : 'display="inline"'}></d-skeleton>
</div>`).ast;
            children.push(...ast.children);
        }

        // if (el.tag === 'slot')
        //     debugger;
    });
};

