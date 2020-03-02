const compiler = require('vue-template-compiler');

// function addSlotHolder(el) {
//     el.parent
// }

module.exports = {
    transformNode(el, options) {
        // if (el.tag === 'slot')
        //     debugger;
    },
    postTransformNode(el, options) {
        // // 从根节点处理
        // if (el.parent)
        //     return;
        if (el.tag === 'slot') {
            const children = el.parent.children;
            const index = children.indexOf(el);


            const ast = compiler.compile(`<div class="vusion-designer-slot"></div>`).ast;
            children.splice(index + 1, 0, ast);
        }

        // if (el.tag === 'slot')
        //     debugger;
    },
};
