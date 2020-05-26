<template>
<div>
    <d-highlighter :info="hover"></d-highlighter>
    <d-highlighter mode="selected" :info="selected"></d-highlighter>
</div>
</template>

<script>
import manipulator from '../manipulator';

export default {
    data() {
        return {
            contextVM: undefined,
            hover: {},
            selected: {},
        };
    },
    mounted() {
        this.onRoute();
        this.$parent.$on('route', this.onRoute);

        // https://github.com/vuejs/vue-devtools/blob/dev/packages/app-backend/src/component-selector.js
        window.addEventListener('mouseover', this.onMouseOver, true);
        window.addEventListener('click', this.onClick, true);
        window.addEventListener('mouseleave', this.onMouseLeave, true);
        window.addEventListener('mouseout', this.cancelEvent, true);
        window.addEventListener('mouseenter', this.cancelEvent, true);
        window.addEventListener('mousedown', this.cancelEvent, true);
        window.addEventListener('mouseup', this.cancelEvent, true);

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

            const type = node.__vue__ ? 'component' : 'element';
            let tag = type === 'component' ? node.__vue__.$options.name : node.tagName;
            if (!tag)
                return {};

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
        // 每次切换页面，从这里开始
        onRoute(to, from) {
            setTimeout(() => {
                this.contextVM = this.$parent.appVM.$children[0];
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
            this.cancelEvent(e, nodeInfo);
            this.selected = nodeInfo;
            this.send({
                command: 'selectNode',
                type: nodeInfo.type,
                tag: nodeInfo.tag,
                scopeId: nodeInfo.scopeId,
                nodePath: nodeInfo.nodePath,
            });
        },
        send(data) {
            const dataString = JSON.stringify(data);
            console.info('[vusion:designer] Send: ' + (dataString.length > 100 ? dataString.slice(0, 100) + '...' : dataString));
            window.parent.postMessage({ protocol: 'vusion', sender: 'designer', data }, '*');
        },
        onMessage(e) {
            console.log(e.data);
            if (!e.data || e.data.protocol !== 'vusion')
                return;
            if (e.data.sender === 'designer')
                return;

            const data = e.data.data;
            if (data.command === 'selectNode') {
                const el = document.querySelector(`[vusion-node-path="${data.nodePath}"]`);
                console.log(el);
                const nodeInfo = this.getNodeInfo(el);
                this.selected = nodeInfo;
            }
        },
    },
};
</script>

<style module>
:global #app * {
    cursor: default !important;
}
</style>
