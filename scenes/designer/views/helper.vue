<template>
<div>
    <d-highlighter ref="hover" :info="hover"></d-highlighter>
    <d-highlighter ref="selected" mode="selected" :info="selected"></d-highlighter>
    <div v-show="contextVM" :class="$style.mask" :style="maskStyle"></div>
    <div v-show="subVM" :class="$style.mask" :style="subMaskStyle"></div>
</div>
</template>

<script>
import * as compiler from 'vue-template-compiler/browser';
import { compilerPlugin } from '../transform';
import api from 'vue-hot-reload-api';
import Vue from 'vue';
import * as utils from '../utils';

let lastChanged = 0;
{
    const oldRerender = api.rerender;
    api.rerender = function (id, options, live) {
        oldRerender(id, options);
        if (!live)
            lastChanged--;
        api.onRerender && api.onRerender(id, options, live);
    };

    const oldReload = api.reload;
    api.reload = function (id, options, live) {
        // const component = window.__VUE_HOT_MAP__[id];
        oldReload(id, options);
        // oldRerender(id, options);
        if (!live)
            lastChanged--;
        api.onReload && api.onReload(id, options, live);
    };
}

export default {
    name: 'helper',
    data() {
        return {
            // appVM: undefined,
            // router: undefined,
            contextPath: '',
            oldContextVM: undefined,
            contextVM: undefined,
            contextDepth: 0,
            subVM: undefined,
            hover: {},
            selected: {},
            slotsMap: new WeakMap(),
            maskStyle: {},
            subMaskStyle: {},
        };
    },
    watch: {
        selected(selected, old) {
            // @TODO:
            // if (selected && old
            //     && selected.scopeId === old.scopeId
            //     && selected.tag === old.tag
            //     && selected.nodePath === old.nodePath) {
            //     const dSlot = this.slotsMap.get(old);
            //     if (dSlot) {
            //         this.slotsMap.delete(old);
            //         dSlot.nodeInfo = selected;
            //         selected.el.append(dSlot.$el);
            //         this.slotsMap.set(selected, dSlot);
            //     }
            //     return;
            // }

            if (old && this.slotsMap.has(old)) {
                const slots = this.slotsMap.get(old);
                slots.forEach((slot) => {
                    slot.$el.remove();
                    slot.$destroy();
                });
                this.slotsMap.delete(old);
            }

            if (selected && selected.el) {
                if (getComputedStyle(selected.el).display.includes('inline')) {
                    // dSlot.display = 'inline';
                    return;
                }
                // const tag = nodeInfo.tag;
                const slots = [];
                if (selected.tag !== 'u-linear-layout' && selected.tag !== 'u-grid-layout-column') {
                    const appendSlot = this.createDSlot({
                        propsData: {
                            position: 'append',
                            nodeInfo: selected,
                        },
                    });
                    selected.el.append(appendSlot.$el);
                    slots.push(appendSlot);
                }
                if (selected.el !== this.contextVM.$el) {
                    const insertBeforeSlot = this.createDSlot({
                        propsData: {
                            position: 'insertBefore',
                            nodeInfo: selected,
                        },
                    });
                    selected.el.parentElement.insertBefore(insertBeforeSlot.$el, selected.el);
                    slots.push(insertBeforeSlot);
                    const insertAfterSlot = this.createDSlot({
                        propsData: {
                            position: 'insertAfter',
                            nodeInfo: selected,
                        },
                    });
                    selected.el.parentElement.insertBefore(insertAfterSlot.$el, selected.el.nextElementSibling);
                    slots.push(insertAfterSlot);
                }
                this.slotsMap.set(selected, slots);
            }
        },
    },
    mounted() {
        // appVM 的实体是在 router 中的，所以需要延时获取
        setTimeout(() => {
            const appEl = document.getElementById('app');
            this.appVM = appEl.__vue__;
            this.router = this.appVM.$router;

            if (!this.appVM || !this.router) {
                return console.error('[vusion:designer] Cannot find appVM');
            }

            this.appVM.$on('d-slot:send', this.onDSlotSend);
            this.appVM.$on('d-slot:mode-change', this.onDSlotModeChange);

            // this.router.afterEach((to, from) => this.onRoute(to, from));
            this.onNavigate();

            this.sendCommand('ready', {
                routerMode: this.router.options.mode,
            });

            console.info('[vusion:designer] Helper ready');
        });

        api.onRerender = api.onReload = (id, options, live) => {
            setTimeout(() => {
                !live && this.updateContext(options);
                const oldHover = this.hover;
                if (oldHover) {
                    const el = document.querySelector(`[vusion-node-path="${oldHover.nodePath}"]`);
                    const nodeInfo = this.getNodeInfo(el);
                    if (nodeInfo.el !== oldHover.el) {
                        this.hover = nodeInfo;
                    } else
                        this.$refs.hover.computeStyle();
                }
                const oldSelected = this.selected;
                if (oldSelected) {
                    const el = document.querySelector(`[vusion-node-path="${oldSelected.nodePath}"]`);
                    const nodeInfo = this.getNodeInfo(el);
                    this.select(nodeInfo);
                    this.$refs.selected.computeStyle();
                }
                // this.$refs.hover.computeStyle();
                // this.$refs.selected.computeStyle();
            });
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

        window.addEventListener('scroll', this.updateStyle, true);
        window.addEventListener('resize', this.updateStyle);

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

        window.addEventListener('scroll', this.updateStyle, true);
        window.addEventListener('resize', this.updateStyle);

        window.removeEventListener('message', this.onMessage);

        this.appVM.$off('d-slot:send', this.onDSlotSend);
        this.appVM.$off('d-slot:mode-change', this.onDSlotModeChange);
    },
    methods: {
        /**
         * routePath 为 ViewPath 格式
         */
        navigate(routePath, replace = true) {
            const [backend, to] = routePath.replace(/\/$/, '').split('#');
            if (replace)
                this.router.replace(to);
            else
                this.router.push(to);

            this.onNavigate(to);
        },
        /**
         * onNavigate 导航变更时触发
         * @on
         * - 页面每次加载
         * - 路由跳转
         * 目前只处理 history 模式
         */
        onNavigate(contextPath = '') {
            // if (contextPath !== undefined)
            this.contextPath = contextPath;
            // else {
            //     const cap = location.pathname.match(/^\/.+?\//);
            //     if (!cap)
            //         return;
            //     this.contextPath = location.pathname.slice(cap[0].length - 1);
            // }

            setTimeout(() => {
                this.reset();
                this.updateContext();
            });
        },
        reset() {
            this.hover = {};
            this.selected = {};
        },
        getRelatedVue(node) {
            while (node && !node.__vue__)
                node = node.parentElement;
            return node && node.__vue__;
        },
        isDesignerComponent(node) {
            let vue = this.getRelatedVue(node);
            // console.log(vue && vue.$options.name, vue.$root && vue.$root.$options.name);
            while (vue) {
                if (vue.$options.name && vue.$options.name.startsWith('d-'))
                    return true;
                vue = vue.$parent;
            }
            return false;
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
            // if (tag.startsWith('d-'))
            //     return {};

            return {
                el: node,
                type,
                tag,
                scopeId,
                nodePath: node.getAttribute('vusion-node-path'),
            };
        },
        /**
         * 更新上下文实例信息
         *  @on
         *  - onNavigate 导航变更时触发
         *   - 页面每次加载
         *   - 路由跳转
         * - reload
         * - rerender
         */
        updateContext(copts) {
            this.oldContextVM = this.contextVM;
            this.contextVM = undefined;
            this.contextDepth = 0;
            this.subVM = undefined;
            console.log('Find context:', this.appVM.$route.matched, this.contextPath);
            utils.walkInstance(this.appVM, (nodeVM) => {
                const data = nodeVM.$vnode.data;
                if (data.routerView) {
                    if (this.appVM.$route.matched[data.routerViewDepth].path === this.contextPath) {
                        this.contextVM = nodeVM;
                        this.contextDepth = data.routerViewDepth;
                    } else if (this.contextVM && this.contextDepth === data.routerViewDepth - 1) {
                        this.subVM = nodeVM;
                    }
                }
            });

            this.updateStyle();

            // copts = copts || this.contextVM.constructor.options;
            // !lastChanged &&
            // this.send({ command: 'initContext', copts: JSON.stringify({
            //     file: copts.__file,
            //     scopeId: copts._scopeId,
            //     // @TODO: 之后这几个应该可以放在外边做
            //     source: copts.__source,
            //     script: copts.__script,
            //     style: copts.__style,
            //     template: copts.__template,
            // }) });
        },
        /**
         * 更新样式
         * @on
         * - updateContext
         * - scroll
         * - resize
         */
        updateStyle() {
            this.$refs.hover.computeStyle();
            this.$refs.selected.computeStyle();
            this.computedMaskStyle();
        },
        /**
         * 重新计算 Mask 样式
         */
        computedMaskStyle() {
            this.maskStyle = {};
            if (this.contextVM) {
                const contextRect = utils.getVisibleRect(this.contextVM.$el);
                contextRect.left -= 20;
                contextRect.top -= 20;
                contextRect.right += 20;
                contextRect.bottom += 20;
                contextRect.width += 40;
                contextRect.height += 40;
                this.maskStyle = {
                    clipPath: `polygon(0 0, 100% 0, 100% 100%, 0 100%, 0 0,
                        ${contextRect.left}px ${contextRect.top}px,
                        ${contextRect.left}px ${contextRect.bottom}px,
                        ${contextRect.right}px ${contextRect.bottom}px,
                        ${contextRect.right}px ${contextRect.top}px,
                        ${contextRect.left}px ${contextRect.top}px, 0 0)
                    `,
                };
            }
            this.subMaskStyle = {};
            if (this.subVM) {
                const subRect = utils.getVisibleRect(this.subVM.$el);
                // subRect.left += 20;
                // subRect.top += 20;
                // subRect.right -= 20;
                // subRect.bottom -= 20;
                // subRect.width -= 40;
                // subRect.height -= 40;
                this.subMaskStyle = {
                    clipPath: `polygon(${subRect.left}px ${subRect.top}px,
                        ${subRect.right}px ${subRect.top}px,
                        ${subRect.right}px ${subRect.bottom}px,
                        ${subRect.left}px ${subRect.bottom}px,
                        ${subRect.left}px ${subRect.top}px)
                    `,
                };
            }
        },
        onDSlotSend(data) {
            this.send(data);
        },
        onDSlotModeChange($event) {
            this.$nextTick(() => {
                this.$refs.hover.computeStyle();
                this.$refs.selected.computeStyle();
            });
        },
        cancelEvent(e, nodeInfo) {
            if (!this.contextVM || !this.contextVM.$el.contains(e.target))
                return;
            if (!nodeInfo) {
                nodeInfo = this.getNodeInfo(e.target);
                if (this.isDesignerComponent(e.target))
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
            if (this.isDesignerComponent(e.target))
                return;
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
            if (!this.contextVM || !this.contextVM.$el.contains(e.target)) {
                this.send({
                    command: 'selectContext',
                });
                return;
            }

            const nodeInfo = this.getNodeInfo(e.target);
            if (this.isDesignerComponent(e.target))
                return;
            this.cancelEvent(e, nodeInfo);
            // if (nodeInfo.el === this.selected.el)
            //     return;
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
            const dSlot = new Ctor(options);
            dSlot.$on('d-slot:send', (data) => this.send(data));
            dSlot.$mount(el);
            el.__vue__ = dSlot;
            dSlot.$parent = this;
            dSlot.$on('d-slot:mode-change', ($event) => {
                this.$nextTick(() => {
                    this.$refs.hover.computeStyle();
                    this.$refs.selected.computeStyle();
                });
            });
            return dSlot;
        },
        select(nodeInfo) {
            if (nodeInfo.el === this.selected.el)
                return;

            this.selected = nodeInfo;
        },
        send(data) {
            const dataString = JSON.stringify(data);
            console.info('[vusion:designer] Send: ' + dataString); // (dataString.length > 100 ? dataString.slice(0, 100) + '...' : dataString));
            window.parent.postMessage({ protocol: 'vusion', sender: 'designer', data }, '*');
        },
        sendCommand(command, ...args) {
            console.info('[vusion:designer] Send Command: ' + command + ' ' + JSON.stringify(args));
            window.parent.postMessage({ protocol: 'vusion', sender: 'designer', command, args }, '*');
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
            if (e.data.sender === 'designer') // 排除自身
                return;
            if (e.data.command)
                return this[e.data.command](...e.data.args);

            const data = e.data.data;
            if (data.command === 'selectNode') {
                const el = document.querySelector(`[vusion-node-path="${data.nodePath}"]`);
                const nodeInfo = this.getNodeInfo(el);
                this.select(nodeInfo);
            } else if (data.command === 'rerender') {
                this.rerender(data);
            }
        },
        onWebpackMessage(e) {
            if (e.data.type === 'webpackInvalid') {
                // console.log('[vusion:designer] lastChanged:', lastChanged);
                if (!lastChanged)
                    this.send({ command: 'loading', status: true });
            } else if (e.data.type === 'webpackOk') {
                this.send({ command: 'loading', status: false });
            }
        },
        rerender(data) {
            const scopeId = this.contextVM.$options._scopeId;
            const options = {
                scopeId,
                whitespace: 'condense',
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
            api.rerender(scopeId.replace(/^data-v-/, ''), {
                render: new Function(result.render),
                staticRenderFns: result.staticRenderFns.map((code) => new Function(code)),
            }, true);

            lastChanged += 2;
        },
    },
};
</script>

<style module>
:global #app * {
    cursor: default !important;
}

:global #app > div:not([class]) {
    padding-top: 30px;
}

.mask {
    position: fixed;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: 99999000;
    background: rgba(0,0,0,0.5);
}
</style>
