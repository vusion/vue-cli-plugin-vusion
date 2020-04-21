import * as compiler from 'vue-template-compiler/browser';
import { compilerPlugin } from './transform';
import * as flatted from 'flatted';
import TemplateHandler from './TemplateHandler';
import api from 'vue-hot-reload-api';

export { compilerPlugin, flatted };

import Vue from 'vue';
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
        $loading.show();
    } else if (e.data.type === 'webpackOk') {
        $loading.hide();
    }
});

{
    function clearAST(id, options) {
        const component = window.__VUE_HOT_MAP__[id];
        if (component) {
            const componentOptions = component.options;
            componentOptions.staticRenderFns.source = options.staticRenderFns.source;
            componentOptions.ast = undefined;
        }
    }

    const oldRerender = api.rerender;
    api.rerender = function (id, options, live) {
        !live && clearAST(id, options);
        oldRerender(id, options);
    };

    const oldReload = api.reload;
    api.reload = function (id, options, live) {
        !live && clearAST(id, options);
        oldReload(id, options);
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
            // plugins: [compilerPlugin],
            // vueFile: { fullPath: }
        };
        const componentOptions = component.options;
        if (!componentOptions.ast)
            componentOptions.ast = compiler.compile(componentOptions.staticRenderFns.source, options).ast;

        const selectedEl = TemplateHandler.prototype.findByRoute(route, componentOptions.ast);
        let insertIndex = selectedEl.children.findIndex((child) => child.tag === 'd-slot');
        if (!~insertIndex)
            insertIndex = selectedEl.children.length;
        selectedEl.children.splice(insertIndex, 0, compiler.compile(code, options).ast);

        /**
         *
         */
        const puppetOptions = Object.assign({
            vueFile: {
                fullPath: componentOptions.__file,
                tagName: 'test',
            },
        }, options);
        const puppetEl = flatted.parse(flatted.stringify(componentOptions.ast));
        compilerPlugin(puppetEl, puppetOptions, compiler);
        const result = compiler.generate(puppetEl, puppetOptions);

        /* eslint-disable no-new-func */
        api.rerender(scopeId, {
            render: new Function(result.render),
            staticRenderFns: result.staticRenderFns.map((code) => new Function(code)),
        }, true);

        // window.parent.postMessage({ command: 'saveCode', file: this.file, nodePath: this.nodePath, code }, '*');
    },
};

