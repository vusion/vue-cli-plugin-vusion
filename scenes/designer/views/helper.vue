<template>
<div>
    <d-highlighter ref="hover" :info="hover"></d-highlighter>
    <d-highlighter ref="selected" mode="selected" :info="selected" @dragstart="dragging=true" @dragend="onDragEnd"></d-highlighter>
    <div v-show="contextVM" :class="$style.mask" :style="maskStyle" @click="selectContextView"></div>
    <div v-show="subVM" :class="$style.mask" :style="subMaskStyle" @click="selectContextView"></div>
    <d-drop ref="drop" :info="targetNode" :target-position="targetPosition"></d-drop>
</div>
</template>

<script>
import * as compiler from 'vue-template-compiler/browser';
import { compilerPlugin } from '../transform';
import api from 'vue-hot-reload-api';
import Vue from 'vue';
import * as utils from '../utils';
import throttle from 'lodash/throttle';
import { v4 as uuidv4 } from 'uuid';
import { MPublisher } from 'cloud-ui.vusion';
import VueRouter from 'vue-router';
import sum from 'hash-sum';
import { postcssParse } from './cssParse';

let lastChangedFile = '';
const oldRerender = api.rerender;
api.rerender = function (id, options, live) {
    if (!live && lastChangedFile === options.__file) {
        lastChangedFile = '';
        return;
    } else {
        oldRerender(id, options);
    }
    api.onRerender && api.onRerender(id, options, live);
};

const oldReload = api.reload;
api.reload = function (id, options, live) {
    if (!live && lastChangedFile === options.__file) {
        lastChangedFile = '';
        return;
    } else {
        // const component = window.__VUE_HOT_MAP__[id];
        oldReload(id, options);
        // oldRerender(id, options);
    }
    api.onReload && api.onReload(id, options, live);
};

export default {
    name: 'helper',
    mixins: [MPublisher],
    publish: {
        allNodesAPI: 'allNodesAPI',
    },
    data() {
        return {
            // appVM: undefined,
            // router: undefined,
            contextPath: '',
            oldContextVM: undefined,
            contextVM: undefined,
            contextDepth: 0,
            oldSubVM: undefined,
            subVM: undefined,
            hover: {},
            selected: {},
            slotsMap: new WeakMap(),
            maskStyle: {},
            subMaskStyle: {},
            dragging: false,
            targetNode: {},
            targetPosition: {},
            requests: new Map(),
            allNodesAPI: {},
        };
    },
    watch: {
        selected(selected, old) {
            if (old && this.slotsMap.has(old)) {
                const slots = this.slotsMap.get(old);
                slots.forEach((slot) => {
                    slot.$el.remove();
                    slot.$destroy();
                });
                this.slotsMap.delete(old);
            }

            if (selected && this.allNodesAPI) {
                const cloudui = this.allNodesAPI[selected.tag];
                const slots = cloudui && cloudui.slots || [];
                if (slots.length)
                    this.attribute2slot(selected);
            }
        },
    },
    mounted() {
        // appVM 的实体是在 router 中的，所以需要延时获取
        setTimeout(() => {
            const children = Array.from(document.body.children);
            let appVM;
            for (const el of children) {
                if (el.__vue__ && el.__vue__.$options.name === 'app') {
                    appVM = el.__vue__;
                    break;
                }
            }
            if (!appVM)
                return console.error('[vusion:designer] Cannot find appVM');

            appVM.$el.setAttribute('root-app', '');
            this.appVM = appVM;
            this.router = this.appVM.$router;

            this.appVM.$on('d-slot:send', this.onDSlotSend);
            this.appVM.$on('d-slot:sendCommand', this.onDSlotSendCommand);
            this.appVM.$on('d-slot:mode-change', this.onDSlotModeChange);

            // this.router.afterEach((to, from) => this.onNavigate(to.path));
            this.onNavigate();

            this.getExternalLibrary();

            this.sendCommand('ready', {
                routerMode: this.router.options.mode,
            });

            console.info('[vusion:designer] Helper ready');
        }, 200);

        api.onRerender = api.onReload = (id, options, live) => {
            setTimeout(() => {
                if (!live) {
                    this.sendCommand('updateContext');
                    this.updateContext(options);
                } else {
                    // this.updateContext(options);
                    this.computedMaskStyle();
                }

                const oldHover = this.hover;
                if (oldHover) {
                    const el = document.querySelector(`[data-v-${id}] [vusion-node-path="${oldHover.nodePath}"]`);
                    const nodeInfo = this.getNodeInfo(el);
                    if (nodeInfo.el !== oldHover.el) {
                        this.hover = nodeInfo;
                    } else
                        this.$refs.hover.computeStyle();
                }
                const oldSelected = this.selected;
                if (oldSelected) {
                    const el = document.querySelector(`[data-v-${id}] [vusion-node-path="${oldSelected.nodePath}"]`);
                    const nodeInfo = this.getNodeInfo(el);
                    this.select(nodeInfo);
                    this.$refs.selected.computeStyle();
                }
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

        document.body.addEventListener('dragover', this.onDragOver);
        document.body.addEventListener('drop', this.onDragEnd);

        Vue.config.errorHandler = (err, vm, info) => {
            if (vm && vm.$route)
                this.send({ command: 'problems', data: err + ' in ' + vm.$route.fullPath });
            else
                this.send({ command: 'problems', data: err });
        };

        this.throttleHandlerDrag = throttle(this.handlerDrag, 300);
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

        document.body.removeEventListener('dragover', this.onDragOver);
        document.body.removeEventListener('drop', this.onDragEnd);

        this.appVM.$off('d-slot:send', this.onDSlotSend);
        this.appVM.$off('d-slot:sendCommand', this.onDSlotSendCommand);
        this.appVM.$off('d-slot:mode-change', this.onDSlotModeChange);
    },
    methods: {
        /**
         * routePath 为 ViewPath 格式
         */
        navigate(routePath, replace = true) {
            // if (!this.router)
            //     return;
            // const [backend, to] = routePath.replace(/\/$/, '').split('#');
            // if (replace)
            //     this.router.replace(to);
            // else
            //     this.router.push(to);

            // this.onNavigate(to);
        },
        /**
         * onNavigate 导航变更时触发，即 contextPath 改变
         * @on
         * - 页面每次加载
         * - 路由跳转
         * 目前只处理 history 模式
         */
        async onNavigate(contextPath) {
            // if (contextPath !== undefined)
            //     this.contextPath = await new Promise((res) => setTimeout(() => res(contextPath)));
            // else {
            //     const routePath = await this.execCommand('getContextViewRoute');
            //     const [backend, to] = routePath.replace(/\/$/, '').split('#');
            //     this.contextPath = to;
            //     // const cap = location.pathname.match(/^\/.+?\//);
            //     // this.contextPath = cap ? location.pathname.slice(cap[0].length - 1) : '';
            // }

            // this.reset();
            // this.updateContext();
        },
        /**
         * @on
         * - onNavigate 导航变更时触发，即 contextPath 改变
         */
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
                if (vue.$options.name && vue.$options.name.startsWith('d-') && !vue.$options.name.startsWith('d-router-view'))
                    return true;
                vue = vue.$parent;
            }
            return false;
        },
        getNodeInfo(node) {
            if (!this.contextVM)
                return {};

            const scopeId = this.contextVM.$options._scopeId;
            while (node && !node.hasAttribute(scopeId) && node.getAttribute('vusion-scope-id') !== scopeId)
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

            let parentNodePath;
            if (node.hasAttribute('vusion-parent-node-path')) {
                parentNodePath = node.getAttribute('vusion-parent-node-path') || '/';
            }
            let title = tag;
            if (this.allNodesAPI) {
                title = this.allNodesAPI[tag] && this.allNodesAPI[tag].title;
            }
            return {
                el: node,
                type,
                tag,
                scopeId,
                nodePath: node.getAttribute('vusion-node-path'),
                parentNodePath,
                title,
            };
        },
        /**
         * 更新上下文实例信息
         * @on
         * - onNavigate 导航变更时触发，即 contextPath 改变
         * - reload
         * - rerender
         */
        updateContext(copts) {
            this.oldContextVM = this.contextVM;
            this.contextVM = undefined;
            this.contextDepth = 0;
            this.oldSubVM = this.subVM;
            this.subVM = undefined;
            console.log('Find context:', this.appVM.$route.matched, this.contextPath);
            utils.walkInstance(this.appVM, (nodeVM) => {
                if (!nodeVM.$vnode)
                    return;
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

            this.oldContextVM && this.oldContextVM.$el && this.oldContextVM.$el.removeAttribute('vusion-context-vm');
            this.contextVM && this.contextVM.$el && this.contextVM.$el.setAttribute('vusion-context-vm', '');
            this.oldSubVM && this.oldSubVM.$el && this.oldSubVM.$el.removeAttribute('vusion-sub-vm');
            this.subVM && this.subVM.$el && this.subVM.$el.setAttribute('vusion-sub-vm', '');
            this.updateStyle();

            // copts = copts || this.contextVM.constructor.options;
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
            this.$refs.drop.computeStyle();
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
                // contextRect.top -= 20;
                contextRect.right += 20;
                // contextRect.bottom += 20;
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
        cancelEvent(e) {
            if (this.dragging)
                return;
            if (this.$el.contains(e.target)) // helperVM 中的事件不拦截、不处理
                return;
            if (this.isDesignerComponent(e.target)) // d-component 不拦截
                return;
            e.stopImmediatePropagation();
            e.preventDefault();
        },
        preventDefault(e) {
            e.preventDefault();
        },
        onMouseOver(e) {
            if (this.$el.contains(e.target)) { // helperVM 中的事件不拦截、不处理
                if (this.isInSubMask(event)) {
                    const nodeInfo = this.getNodeInfo(this.subVM.$el.parentElement);
                    this.hover = nodeInfo;
                } else {
                    this.hover = {};
                }
                return;
            }
            if (this.isDesignerComponent(e.target)) { // d-component 不拦截
                if (e.target.className && e.target.className.startsWith('d-text')) {
                    const nodeRect = utils.getVisibleRect(e.target);
                    const parentRect = utils.getVisibleRect(e.target.parentElement);
                    if (nodeRect.width === parentRect.width || nodeRect.height === parentRect.height) {
                        const nodeInfo = this.getNodeInfo(e.target.parentElement);
                        this.hover = nodeInfo;
                    }
                }
                return;
            }
            this.cancelEvent(e);

            const nodeInfo = this.getNodeInfo(e.target);
            this.hover = nodeInfo;
        },
        onMouseLeave(e) {
            if (this.$el.contains(e.target)) // helperVM 中的事件不拦截、不处理
                return;
            if (this.isDesignerComponent(e.target)) // d-component 不拦截
                return;
            this.cancelEvent(e);

            this.hover = {};
        },
        onClick(e) {
            if (this.$el.contains(e.target)) { // helperVM 中的事件不拦截、不处理
                return;
            }
            if (this.isDesignerComponent(e.target)) {
                if (e.target.className && e.target.className.startsWith('d-text')) {
                    const nodeInfo = this.getNodeInfo(e.target.parentElement);
                    this.select(nodeInfo);
                    this.send({
                        command: 'selectNode',
                        type: nodeInfo.type,
                        tag: nodeInfo.tag,
                        scopeId: nodeInfo.scopeId,
                        nodePath: nodeInfo.nodePath,
                    });
                }
                return;
            }

            // d-slot有popup弹出，点击关闭
            if (window.dslotPopper && window.dslotPopper.length) {
                window.dslotPopper.forEach((item) => {
                    item.close();
                });
            }

            this.cancelEvent(e);

            if (!(this.contextVM && this.contextVM.$el.contains(e.target))) { // 不在 contextVM 中，视为选中 contextView
                return this.selectContextView();
            }

            const nodeInfo = this.getNodeInfo(e.target);
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

            // slot 属性可编辑
            this.editSlotAttribute(e, nodeInfo);
        },
        select(nodeInfo) {
            if (nodeInfo.el === this.selected.el)
                return;

            this.selected = nodeInfo;
        },
        /**
         * 不选具体组件，只选页面
         */
        selectContextView(event) {
            if (this.isInSubMask(event)) {
                const nodeInfo = this.getNodeInfo(this.subVM.$el.parentElement);
                this.select(nodeInfo);
            } else {
                this.select({});
                this.sendCommand('selectContextView');
            }
        },
        createDText(options) {
            const Ctor = Vue.component('d-text');
            const el = document.createElement('span');
            const dText = new Ctor(options);
            dText.$on('d-slot:send', this.onDSlotSend);
            dText.$on('d-text:blur', this.onDTextBlur);
            dText.$mount(el);
            el.__vue__ = dText;
            dText.$parent = this;
            return dText;
        },
        createDSlot(options) {
            const Ctor = Vue.component('d-slot');
            const el = document.createElement('div');
            const dSlot = new Ctor(options);
            dSlot.$on('d-slot:send', this.onDSlotSend);
            dSlot.$on('d-slot:sendCommand', this.onDSlotSendCommand);
            dSlot.$mount(el);
            el.__vue__ = dSlot;
            dSlot.$parent = this;
            dSlot.$on('d-slot:mode-change', this.onDSlotModeChange);
            return dSlot;
        },
        onDSlotSend(data) {
            this.send(data);
        },
        onDSlotSendCommand(...args) {
            this.sendCommand(...args);
        },
        onDSlotModeChange($event) {
            setTimeout(() => this.updateStyle());
        },
        onDTextBlur(context) {
            setTimeout(() => {
                const parent = context.$el.parentElement;
                const nextSibling = context.$el.nextSibling;
                if (parent && nextSibling) {
                    parent.removeChild(context.$el);
                    nextSibling.style.display = '';
                }
            });
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
        /**
         * 双向通信
         */
        execCommand(command, ...args) {
            const message = { id: uuidv4(), protocol: 'vusion', sender: 'designer', type: 'request', command, args };
            window.parent.postMessage(message, '*');
            return new Promise((res, rej) => {
                this.requests.set(message.id, Object.assign({ res, rej }, message));
                setTimeout(() => {
                    this.requests.delete(message.id);
                    rej(Object.assign({ error: 'Timeout' }, message));
                }, 2000);
            });
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
            if (e.data.type === 'response') {
                const message = this.requests.get(e.data.id);
                console.info('[vusion:designer] Exec command: ' + e.data.command + ' ' + e.data.result);
                return message && message.res(e.data.result);
            }
            if (e.data.command)
                return this[e.data.command](...e.data.args);

            const data = e.data.data;
            if (data.command === 'selectNode') {
                const scopeId = this.contextVM.$options._scopeId || '';
                const el = document.querySelector(`[${scopeId}][vusion-node-path="${data.nodePath}"], [vusion-scope-id="${scopeId}"][vusion-node-path="${data.nodePath}"]`);
                const nodeInfo = this.getNodeInfo(el);
                this.select(nodeInfo);
            }
        },
        onWebpackMessage(e) {
            if (e.data.type === 'webpackInvalid') {
                this.send({ command: 'hotReload', status: true });
                //     this.send({ command: 'loading', status: true });
            } else if (e.data.type === 'webpackOk') {
                // this.send({ command: 'loading', status: false });
                this.send({ command: 'loading', status: true });
            } else if (e.data.type === 'webpackErrors') {
                this.send({ command: 'problems', data: e.data.data });
                // const overlay = document.getElementById('webpack-dev-server-client-overlay');
                // overlay && (overlay.style.display = 'none');
            }
        },
        rerender(data) {
            const scopeId = this.contextVM.$options._scopeId || '';
            const options = {
                scopeId,
                whitespace: 'condense',
            };

            /**
             * 更新 render 函数
             */
            const puppetOptions = Object.assign({
                plugins: [compilerPlugin],
            }, options);
            // const puppetEl = flatted.parse(flatted.stringify(copts.__template.ast));
            // compilerPlugin(puppetEl, puppetOptions, compiler);
            // const result = compiler.generate(puppetEl, puppetOptions);
            const result = compiler.compile(data.content, puppetOptions);

            /* eslint-disable no-new-func */
            api.rerender(scopeId.replace(/^data-v-/, ''), {
                __file: data.__file,
                render: new Function(result.render),
                staticRenderFns: result.staticRenderFns.map((code) => new Function(code)),
            }, true);

            lastChangedFile = data.__file;
        },
        run(expression, self) {
            return Function(`with (${self}) { return ${expression} }`).call(this);
        },
        request(expression, self) {
            this.run(expression, self)
                .then((res) => {
                    this.send({ type: 'response', res });
                });
        },
        onDragOver(event) {
            event.preventDefault();
            this.dragging = true;
            this.throttleHandlerDrag(event);
            return true;
        },
        onDragEnd(event) {
            this.dragging = false;
            this.targetNode = {};
        },
        handlerDrag(event) {
            if (this.isDropComponent(event.target)) {
                if (this.isDslotComponent(event.target)) {
                    this.targetNode = {};
                }
                return;
            }
            if (!this.dragging) {
                this.targetNode = {};
                return;
            }
            let target = event.target;
            if (this.isInSubMask(event)) {
                target = this.subVM.$el.parentElement;
            }
            const node = this.getNodeInfo(target);
            this.targetPosition = {
                x: event.x,
                y: event.y,
            };
            if (Object.keys(node).length
                && (this.targetNode.nodePath !== node.nodePath
                || this.targetNode.scopeId !== node.scopeId
                || this.targetNode.tag !== node.tag)) {
                this.targetNode = node;
            }
        },
        isDropComponent(node) {
            let vue = this.getRelatedVue(node);
            while (vue) {
                if (vue.$options.name && (vue.$options.name.startsWith('d-drop') || vue.$options.name.startsWith('d-slot')))
                    return true;
                vue = vue.$parent;
            }
            return false;
        },
        isDslotComponent(node) {
            let vue = this.getRelatedVue(node);
            while (vue) {
                if (vue.$options.name && vue.$options.name.startsWith('d-slot'))
                    return true;
                vue = vue.$parent;
            }
            return false;
        },
        isInSubMask(event) {
            if (!event || !this.subVM || !this.subVM.$el.parentElement || !this.subVM.$el.parentElement.hasAttribute('router-view'))
                return;
            const subRect = utils.getVisibleRect(this.subVM.$el.parentElement);
            if (event.x >= subRect.left && event.x <= subRect.right && event.y >= subRect.top && event.y <= subRect.bottom) {
                return true;
            } else {
                return false;
            }
        },
        getExternalLibrary() {
            this.execCommand('getInit').then((res) => {
                this.allNodesAPI = res.allNodesAPI;
            });
        },
        editSlotAttribute(e, selected) {
            if (e.target && e.target.nodeType === 1 && e.target.hasAttribute('vusion-slot-name')) {
                const childNodes = Array.from(e.target.childNodes);
                const textNode = childNodes.filter((item) => item.nodeType === 3);
                if (textNode.length === 1) {
                    const name = e.target.getAttribute('vusion-slot-name');
                    const dText = this.createDText({
                        propsData: {
                            text: textNode[0].nodeValue,
                            nodePath: e.target.getAttribute('vusion-node-path'),
                            parentNodePath: selected.nodePath,
                            slotName: name,
                        },
                    });
                    e.target.parentElement.insertBefore(dText.$el, e.target);
                    e.target.style.display = 'none';
                    setTimeout(() => {
                        dText.$el.focus();
                    });
                }
            }
        },
        /**
         * 属性转换为slot，或空的slot可添加
         */
        attribute2slot(selected) {
            const el = selected.el;
            const stack = [];
            stack.push(el);
            let node;
            const slots = [];
            while (stack.length) {
                node = stack.pop();
                if (!node || !node.childNodes)
                    continue;
                const children = Array.from(node.childNodes);
                children.forEach((item) => {
                    const className = item.className && item.className.replace(/[_]/g, '-');
                    if (item.nodeType === 1
                        && !(item.className && item.className.startsWith('d-'))
                        && (className && className.startsWith(selected.tag))
                        && item.hasAttribute('vusion-slot-name')) {
                        const childNodes = item.childNodes;
                        const name = item.getAttribute('vusion-slot-name');
                        if (!childNodes.length || (childNodes.length === 1 && childNodes[0].nodeType === 3)) {
                            const nodeInfo = this.getNodeInfo(item);
                            const dSlot = this.createDSlot({
                                propsData: {
                                    display: 'inline',
                                    slotName: name,
                                    nodeInfo,
                                    transform: {
                                        value: childNodes[0] && childNodes[0].nodeValue,
                                    },
                                },
                            });
                            item.appendChild(dSlot.$el);
                            slots.push(dSlot);
                        }
                    }
                });
                if (children.length) {
                    for (let i = children.length - 1; i >= 0; i--) {
                        const className = children[i].className && children[i].className.replace(/[_]/g, '-');
                        if (children[i].nodeType === 1
                            && !(children[i].className && children[i].className.startsWith('d-'))
                            && (!className || className.startsWith(selected.tag))
                            && !children[i].hasAttribute('vusion-slot-name'))
                            stack.push(children[i]);
                    }
                }
            }
            slots.length && this.slotsMap.set(selected, slots);
        },
        rerenderView(data) {
            this.parseRoutes(data.routes);
            const root = Vue.extend({ template: '<div><router-view></router-view></div>' });
            const routes = [data.routes];
            routes.push({ path: '*', component: root });
            routes[0].component = root;
            const router = new VueRouter({ routes });

            this.appVM.$destroy();
            // 重新生成实例
            const appVM = new Vue({
                name: 'app',
                router,
                template: '<router-view></router-view>',
            }).$mount(this.appVM.$el);
            document.getElementById('loading').style.display = 'none';

            setTimeout(() => {
                const path = '/' + data.path.join('/');
                if (this.contextPath !== path)
                    appVM.$router.push(path);
                this.contextPath = path;
                setTimeout(() => {
                    this.appVM = appVM;
                    this.appVM.$el.setAttribute('root-app', '');
                    this.router = this.appVM.$router;
                    this.appVM.$on('d-slot:send', this.onDSlotSend);
                    this.appVM.$on('d-slot:sendCommand', this.onDSlotSendCommand);
                    this.appVM.$on('d-slot:mode-change', this.onDSlotModeChange);

                    this.updateContext();
                    if (this.contextVM)
                        this.getHighLighter(this.contextVM.$options._scopeId);
                }, 0);
                this.send({ command: 'loading', status: false });
            }, 0);
        },
        parseRoutes(routes) {
            if (!routes.children)
                return;

            const children = routes.children;
            children.forEach((node) => {
                const comp = node.component;
                const code = this.parse(comp.script);

                const hash = sum(comp.vueFilePath);
                let cssPrefix = '';
                if (comp.style) {
                    cssPrefix = ('' + node.path) + '_' + hash + '_';
                    const oldStyle = document.getElementById(cssPrefix);
                    if (oldStyle) {
                        oldStyle.remove();
                    }
                    const style = document.createElement('style');
                    style.type = 'text/css';
                    let content = comp.style.replace('<style module>', '').replace('</style>', '');
                    content = postcssParse(content, cssPrefix);
                    style.innerHTML = content;
                    style.id = cssPrefix;
                    document.getElementsByTagName('head')[0].appendChild(style);
                }

                const scopeId = 'data-v-' + hash;
                const options = {
                    scopeId,
                    whitespace: 'condense',
                    cssPrefix,
                };
                const puppetOptions = Object.assign({
                    plugins: [compilerPlugin],
                }, options);
                const result = compiler.compile(comp.template, puppetOptions);

                code.render = new Function(result.render);
                code._scopeId = scopeId;
                const newComp = Vue.extend(code);
                node.component = newComp;
                this.parseRoutes(node);
            });
        },
        parse(source) {
            const content = source.trim().replace(/export default |module\.exports +=/, '');
            return eval('(function(){return ' + content + '})()');
        },
        getHighLighter(id) {
            const oldHover = this.hover;
            if (oldHover) {
                const el = document.querySelector(`[data-v-${id}] [vusion-node-path="${oldHover.nodePath}"]`);
                const nodeInfo = this.getNodeInfo(el);
                if (nodeInfo.el !== oldHover.el) {
                    this.hover = nodeInfo;
                } else
                    this.$refs.hover.computeStyle();
            }
            const oldSelected = this.selected;
            if (oldSelected) {
                const el = document.querySelector(`[data-v-${id}] [vusion-node-path="${oldSelected.nodePath}"]`);
                const nodeInfo = this.getNodeInfo(el);
                this.select(nodeInfo);
                this.$refs.selected.computeStyle();
            }
        },
    },
};
</script>

<style module>
html {
    padding: 20px;
    background: #111217;
}

body {
    overscroll-behavior-x: none;
}

[root-app], [root-app] * {
    cursor: default !important;
}

div:empty:not([class]) {
    min-height: 20px;
}

iframe {
    pointer-events: none;
}

/* [root-app] > div:not([class]) {
    padding-top: 30px;
} */

[root-app] [class^="d-slot_"] {
    display: none;
}

[root-app][vusion-context-vm] [class^="d-slot_"], [root-app] [vusion-context-vm] [class^="d-slot_"] {
    display: block;
}

[root-app][vusion-context-vm] [class^="d-slot_"][display="inline"], [root-app] [vusion-context-vm] [class^="d-slot_"][display="inline"] {
    display: inline-block;
}

[root-app][vusion-sub-vm] [class^="d-slot_"][class], [root-app] [vusion-sub-vm] [class^="d-slot_"][class] {
    display: none;
}

.mask {
    position: fixed;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: 99999000;
    background: hsla(216, 60%, 15%, 0.25);
}
</style>
