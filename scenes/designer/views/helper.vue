<template>
<div>
    <d-highlighter ref="hover" :info="hover"></d-highlighter>
    <d-highlighter ref="selected" mode="selected" :info="selected"></d-highlighter>
</div>
</template>

<script>
import * as compiler from 'vue-template-compiler/browser';
import { compilerPlugin } from '../transform';
import api from 'vue-hot-reload-api';
import Vue from 'vue';
{
    const oldRerender = api.rerender;
    api.rerender = function (id, options, live) {
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

        oldReload(id, options);
        oldRerender(id, options);

        if (!live) {
            const $loading = Vue.prototype.$loading;
            $loading && $loading.hide();
            api.onReload && api.onReload(id, options);
        }
    };
}

export default {
    data() {
        return {
            contextVM: undefined,
            hover: {},
            selected: {},
            lastChanged: 0,
            dSlotMap: new WeakMap(),
        };
    },
    watch: {
        selected(selected, old) {
            if (old && this.dSlotMap.has(old)) {
                const dSlot = this.dSlotMap.get(old);
                dSlot.$el.remove(dSlot.$el);
                dSlot.$destroy();
            }

            if (selected && selected.el) {
                if (getComputedStyle(selected.el).display.includes('inline')) {
                    // dSlot.display = 'inline';
                    return;
                }
                // const tag = nodeInfo.tag;
                const dSlot = this.createDSlot({
                    propsData: {
                        nodeInfo: selected,
                    },
                });
                dSlot.$parent = this;
                dSlot.$on('mode-change', ($event) => {
                    this.$nextTick(() => {
                        this.$refs.hover.computeStyle();
                        this.$refs.selected.computeStyle();
                    });
                });
                selected.el.append(dSlot.$el);
                this.dSlotMap.set(selected, dSlot);
            }
        },
    },
    mounted() {
        this.onRoute();
        this.$parent.$on('route', this.onRoute);
        api.onReload = () => {
            setTimeout(() => this.updateContext());
        };

        // https://github.com/vuejs/vue-devtools/blob/dev/packages/app-backend/src/component-selector.js
        window.addEventListener('mouseover', this.onMouseOver, true);
        window.addEventListener('click', this.onClick, true);
        window.addEventListener('mouseleave', this.onMouseLeave, true);
        window.addEventListener('mouseout', this.cancelEvent, true);
        window.addEventListener('mouseenter', this.cancelEvent, true);
        window.addEventListener('mousedown', this.cancelEvent, true);
        window.addEventListener('mouseup', this.cancelEvent, true);

        window.addEventListener('contextmenu', this.preventDefault, true);

        window.addEventListener('message', this.onMessage);
    },
    destroyed() {
        window.removeEventListener('mouseover', this.elementMouseOver, true);
        window.removeEventListener('click', this.onClick, true);
        window.removeEventListener('mouseleave', this.onMouseLeave, true);
        window.removeEventListener('mouseout', this.cancelEvent, true);
        window.removeEventListener('mouseenter', this.cancelEvent, true);
        window.removeEventListener('mousedown', this.cancelEvent, true);
        window.removeEventListener('mouseup', this.cancelEvent, true);

        window.removeEventListener('contextmenu', this.preventDefault, true);

        window.removeEventListener('message', this.onMessage);
    },
    methods: {
        reset() {
            this.hover = {};
            this.selected = {};
        },
        getNodeInfo(node) {
            if (!this.contextVM)
                return {};

            const scopeId = this.contextVM.$options._scopeId;
            while (node && !node.hasAttribute(scopeId))
                node = node.parentElement;

            if (!node)
                return {};

            let type = node.__vue__ ? 'component' : 'element';
            let tag = type === 'component' ? (node.__vue__.$options.name || 'anonymous') : node.tagName;
            if (node.__vue__ === this.contextVM) { // el 正好为根节点的时候
                if (node.__vue__.$children.length === 1 && node.__vue__.$children[0].$el === node) {
                    type = 'component';
                    tag = node.__vue__.$children[0].$options.name || 'anonymous';
                } else {
                    type = 'element';
                    tag = node.tagName;
                }
            }

            tag = tag.toLowerCase();
            if (tag.startsWith('d-'))
                return {};

            return {
                el: node,
                type,
                tag,
                scopeId,
                nodePath: node.getAttribute('vusion-node-path'),
            };
        },
        updateContext() {
            this.contextVM = this.$parent.appVM.$children[0];
        },
        // 每次切换页面，从这里开始
        onRoute(to, from) {
            setTimeout(() => {
                this.updateContext();
                this.reset();
                if (!this.contextVM)
                    return;

                const copts = this.contextVM.constructor.options;
                this.send({ command: 'initContext', copts: JSON.stringify({
                    file: copts.__file,
                    scopeId: copts._scopeId,
                    // @TODO: 之后这几个应该可以放在外边做
                    source: copts.__source,
                    script: copts.__script,
                    style: copts.__style,
                    template: copts.__template,
                }) });
            });
        },
        cancelEvent(e, nodeInfo) {
            if (!this.contextVM || !this.contextVM.$el.contains(e.target))
                return;
            if (!nodeInfo) {
                nodeInfo = this.getNodeInfo(e.target);
                if (nodeInfo.tag && nodeInfo.tag.startsWith('d-'))
                    return;
            }

            e.stopImmediatePropagation();
            e.preventDefault();
        },
        preventDefault(e) {
            e.preventDefault();
        },
        onMouseOver(e) {
            if (!this.contextVM || !this.contextVM.$el.contains(e.target))
                return;
            const nodeInfo = this.getNodeInfo(e.target);
            this.cancelEvent(e, nodeInfo);
            this.hover = nodeInfo;
        },
        onMouseLeave(e) {
            if (!this.contextVM || !this.contextVM.$el.contains(e.target))
                return;
            this.cancelEvent(e);

            this.hover = {};
        },
        onClick(e) {
            if (!this.contextVM || !this.contextVM.$el.contains(e.target))
                return;

            const nodeInfo = this.getNodeInfo(e.target);
            if (nodeInfo.el === this.selected.el)
                return;
            this.cancelEvent(e, nodeInfo);
            this.select(nodeInfo);

            this.send({
                command: 'selectNode',
                type: nodeInfo.type,
                tag: nodeInfo.tag,
                scopeId: nodeInfo.scopeId,
                nodePath: nodeInfo.nodePath,
            });

            setTimeout(() => {
                nodeInfo.el && this.$refs.selected.$el.focus();
            });
        },
        createDSlot(options) {
            const Ctor = Vue.component('d-slot');
            const el = document.createElement('div');
            return new Ctor(options).$mount(el);
        },
        select(nodeInfo) {
            if (nodeInfo.el === this.selected.el)
                return;

            this.selected = nodeInfo;
        },
        send(data) {
            const dataString = JSON.stringify(data);
            console.info('[vusion:designer] Send: ' + (dataString.length > 100 ? dataString.slice(0, 100) + '...' : dataString));
            window.parent.postMessage({ protocol: 'vusion', sender: 'designer', data }, '*');
        },
        onMessage(e) {
            if (!e.data)
                return;
            if (e.data.source && e.data.source.startsWith('vue-devtools'))
                return;

            if (e.data.type && e.data.type.startsWith('webpack'))
                this.onWebpackMessage(e);
            else if (e.data.protocol === 'vusion')
                this.onVusionMessage(e);
        },
        onVusionMessage(e) {
            if (e.data.sender === 'designer')
                return;

            const data = e.data.data;
            if (data.command === 'selectNode') {
                const el = document.querySelector(`[vusion-node-path="${data.nodePath}"]`);
                const nodeInfo = this.getNodeInfo(el);
                this.select(nodeInfo);
            } else if (data.command === 'rerender') {
                this.rerender(data);
                // setTimeout(() => this.updateContext(), 1000);
            }
        },
        onWebpackMessage(e) {
            if (e.data.type === 'webpackInvalid') {
                // console.log('[vusion:designer] lastChanged:', lastChanged);
                if (!this.lastChanged)
                    this.send({ command: 'loading', status: true });
                else
                    this.lastChanged--;
            } else if (e.data.type === 'webpackOk') {
                this.send({ command: 'loading', status: false });
            }
        },
        rerender(data) {
            const options = {
                scopeId: data.scopeId,
                whitespace: 'condense',
                // plugins: [compilerPlugin],
            };

            /**
             * 更新 render 函数
             */
            const puppetOptions = Object.assign({
                vueFile: {
                    fullPath: data.file,
                    tagName: 'test',
                },
                plugins: [compilerPlugin],
            }, options);
            // const puppetEl = flatted.parse(flatted.stringify(copts.__template.ast));
            // compilerPlugin(puppetEl, puppetOptions, compiler);
            // const result = compiler.generate(puppetEl, puppetOptions);
            const result = compiler.compile(data.content, puppetOptions);

            /* eslint-disable no-new-func */
            api.rerender(data.scopeId.replace(/^data-v-/, ''), {
                render: new Function(result.render),
                staticRenderFns: result.staticRenderFns.map((code) => new Function(code)),
            }, true);

            this.lastChanged += 2;
        },
    },
};
</script>

<style module>
:global #app * {
    cursor: default !important;
}
</style>
