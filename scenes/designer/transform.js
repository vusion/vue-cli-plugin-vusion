// const compiler = require('vue-template-compiler');
// const vusion = require('vusion-api');

// // function addSlotHolder(el) {
// //     el.parent
// // }

// /**
//  * 使用 vue-template-compiler 的 module 有点问题
//  */
// const compilerModule = {
//     transformNode(el, options) {
//         // if (el.tag === 'slot')
//         //     debugger;
//     },
//     postTransformNode(el, options) {
//         if (!options.vueFile.fullPath.includes('test'))
//             return;
//         console.log(el.tag);
//         if (options.vueFile.tagName.startsWith('d-'))
//             return;

//         // // 从根节点处理
//         // if (el.parent)
//         //     return;
//         if (el.tag === 'slot') {
//             // const children = el.parent.children;
//             // const index = children.indexOf(el);

//             // const ast = compiler.compile(`<div class="vusion-designer-slot"></div>`).ast;
//             // children.splice(index + 1, 0, ast);
//         } else if (el.tag === 'div') {
//             if (!el.children)
//                 el.children = [];
//             const children = el.children;

//             const ast = compiler.compile(`<d-slot></d-slot>`).ast;
//             children.push(ast);
//         } else if (el.tag === 'u-linear-layout') {
//             if (!el.children)
//                 el.children = [];
//             const children = el.children;

//             const ast = compiler.compile(`
// <div>
// <d-slot tag="u-linear-layout"></d-slot>
// <d-skeleton></d-skeleton>
// <d-skeleton></d-skeleton>
// </div>`).ast;
//             children.push(...ast.children);
//         }

//         // if (el.tag === 'slot')
//         //     debugger;
//     },
// };
const TemplateHandler = require('vusion-api/out/fs/TemplateHandler').default;

/**
 * 该方法可以在两端(node, browser)运行
 */
exports.compilerPlugin = function compilerPlugin(ast, options, compiler) {
    if (!options.vueFile.fullPath.includes('test.vue'))
        return;
    if (options.vueFile.tagName.startsWith('d-'))
        return;

    const subOptions = Object.assign({}, options);
    delete subOptions.plugins;

    const traverse = TemplateHandler.prototype.traverse;
    traverse.call({ ast }, (nodePath) => {
        const el = nodePath.node;
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

            const tmp = compiler.compile(
                `<d-slot tag="div" scope-id="${options.scopeId.replace('data-v-', '')}" file="${options.vueFile.fullPath}" node-path="${nodePath.route}"></d-slot>`,
                subOptions,
            ).ast;
            children.push(tmp);
        } else if (el.tag === 'u-linear-layout') {
            const children = el.children = el.children || [];

            const tmp = compiler.compile(`
<div>
<d-slot tag="u-linear-layout" ${el.attrsMap.direction === 'vertical' ? '' : 'display="inline"'} scope-id="${options.scopeId.replace('data-v-', '')}" file="${options.vueFile.fullPath}" node-path="${nodePath.route}"></d-slot>
<d-skeleton ${el.attrsMap.direction === 'vertical' ? '' : 'display="inline"'}></d-skeleton>
<d-skeleton ${el.attrsMap.direction === 'vertical' ? '' : 'display="inline"'}></d-skeleton>
</div>`, subOptions).ast;
            children.push(...tmp.children);
        }

        // if (el.tag === 'slot')
        //     debugger;
    });

    const tmp = compiler.compile(`
<div>
<d-loading></d-loading>
</div>`, subOptions).ast;
    if (ast.children) {
        ast.children.push(...tmp.children);
    }
};

