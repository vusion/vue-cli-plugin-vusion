import * as compiler from 'vue-template-compiler/browser';
import { compilerPlugin } from './transform';
import * as flatted from 'flatted';
import TemplateHandler from 'vusion-api/out/fs/TemplateHandler';
import api from 'vue-hot-reload-api';
import Vue from 'vue';

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

        // 能前端处理的代码尽量在前端处理
        window.parent.postMessage({ protocol: 'vusion', sender: 'designer', data: {
            command: 'saveCode', type: 'template', content: copts.__template.content,
        } }, '*');

        // console.log('[vusion:designer] lastChanged:', lastChanged);
    },
};

