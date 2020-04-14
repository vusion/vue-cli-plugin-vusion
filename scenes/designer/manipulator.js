import * as compiler from 'vue-template-compiler/browser';
import { compilerPlugin } from './transform';
import * as flatted from 'flatted';
import TemplateHandler from './TemplateHandler';
import api from 'vue-hot-reload-api';

export { compilerPlugin, flatted };

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
        selectedEl.children.push(compiler.compile(code, options).ast);

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
        });
    },
};

