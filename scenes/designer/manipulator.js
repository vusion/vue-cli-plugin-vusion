import * as compiler from 'vue-template-compiler/browser';
import { compilerPlugin } from './transform';
import * as flatted from 'flatted';
import TemplateHandler from 'vusion-api/out/fs/TemplateHandler';
import api from 'vue-hot-reload-api';
import Vue from 'vue';

export { compilerPlugin, flatted };

let lastChanged = 0;

window.addEventListener('message', (e) => {
    if (!e.data)
        return;
    if (e.data.source && e.data.source.startsWith('vue-devtools'))
        return;
    // console.log(e.data);

    const $loading = Vue.prototype.$loading;
    if (!$loading)
        return;
    if (e.data.type === 'webpackInvalid') {
        console.log('[vusion:designer] lastChanged:', lastChanged);
        if (!lastChanged)
            $loading.show();
        else
            lastChanged--;
    } else if (e.data.type === 'webpackOk') {
        $loading.hide();
    }
});

{
    // function clearAST(id, options) {
    //     const component = window.__VUE_HOT_MAP__[id];
    //     if (component) {
    //         const componentOptions = component.options;
    //         componentOptions.staticRenderFns.source = options.staticRenderFns.source;
    //         componentOptions.ast = undefined;
    //     }
    // }

    const oldRerender = api.rerender;
    api.rerender = function (id, options, live) {
        // !live && clearAST(id, options);
        oldRerender(id, options);
    };

    const oldReload = api.reload;
    api.reload = function (id, options, live) {
        if (!live) {
            const component = window.__VUE_HOT_MAP__[id];
            const oldOptions = component.options;

            const isSame = (o1, o2, type) => (o1[type] === o2[type]) || (o1[type] && o2[type] && o1[type].content === o2[type].content);
            // 大部分可能格式仍然有变动
            if (isSame(oldOptions, options, '__template') && isSame(oldOptions, options, '__script') && isSame(oldOptions, options, '__style')) {
                console.info('[vusion:designer] Same');
                return;
            }
        }

        // !live && clearAST(id, options);
        oldReload(id, options);
        oldRerender(id, options);

        if (!live) {
            const $loading = Vue.prototype.$loading;
            $loading && $loading.hide();
        }
    };
}

export default {
    insert(scopeId, route, code) {
        code = code.replace(/^<template>\s+/, '').replace(/\s+<\/template>$/, '');
        const component = window.__VUE_HOT_MAP__[scopeId];
        console.log(scopeId, route, component);
        if (!component)
            return;

        const options = {
            scopeId,
            whitespace: 'condense',
            // plugins: [compilerPlugin],
        };
        const copts = component.options;
        // 通过 copts.__ 维系一份 template 源码
        if (!copts.__template.ast)
            copts.__template.ast = compiler.compile(copts.__template.content, options).ast;

        // 修改 AST
        const selectedEl = TemplateHandler.prototype.findByRoute(route, copts.__template.ast);
        let insertIndex = selectedEl.children.findIndex((child) => child.tag === 'd-slot');
        if (!~insertIndex)
            insertIndex = selectedEl.children.length;
        selectedEl.children.splice(insertIndex, 0, compiler.compile(code, options).ast);

        const templateHandler = new TemplateHandler('');
        templateHandler.ast = copts.__template.ast;
        copts.__template.content = templateHandler.generate();

        /**
         * 更新 render 函数
         */
        const puppetOptions = Object.assign({
            vueFile: {
                fullPath: copts.__file,
                tagName: 'test',
            },
            plugins: [compilerPlugin],
        }, options);
        // const puppetEl = flatted.parse(flatted.stringify(copts.__template.ast));
        // compilerPlugin(puppetEl, puppetOptions, compiler);
        // const result = compiler.generate(puppetEl, puppetOptions);
        const result = compiler.compile(copts.__template.content, puppetOptions);

        /* eslint-disable no-new-func */
        api.rerender(scopeId, {
            render: new Function(result.render),
            staticRenderFns: result.staticRenderFns.map((code) => new Function(code)),
        }, true);

        lastChanged += 2;
        // 能前端处理的代码尽量在前端处理
        window.parent.postMessage({ protocol: 'vusion', sender: 'designer', data: {
            command: 'saveCode', type: 'template', content: copts.__template.content,
        } }, '*');

        console.log('[vusion:designer] lastChanged:', lastChanged);
    },
};

