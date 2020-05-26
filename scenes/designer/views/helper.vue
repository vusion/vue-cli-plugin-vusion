<template>
<div>
    <d-highlighter :info="hover"></d-highlighter>
    <d-highlighter mode="select" :info="selected"></d-highlighter>
</div>
</template>

<script>
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
    },
    destroyed() {
        window.removeEventListener('mouseover', this.elementMouseOver, true);
        window.removeEventListener('click', this.onClick, true);
        window.removeEventListener('mouseleave', this.onMouseLeave, true);
        window.removeEventListener('mouseout', this.cancelEvent, true);
        window.removeEventListener('mouseenter', this.cancelEvent, true);
        window.removeEventListener('mousedown', this.cancelEvent, true);
        window.removeEventListener('mouseup', this.cancelEvent, true);
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
            return {
                el: node,
                type,
                tagName: type === 'component' ? node.__vue__.$options.name : node.tagName,
            };
        },
        onRoute(to, from) {
            setTimeout(() => {
                this.contextVM = this.$parent.appVM.$children[0];
                this.reset();
            });
        },
        cancelEvent(e) {
            e.stopImmediatePropagation();
            e.preventDefault();
        },
        onMouseOver(e) {
            this.cancelEvent(e);
            // console.log(e.target);
            this.hover = this.getNodeInfo(e.target);
        },
        onMouseLeave(e) {
            this.cancelEvent(e);

            this.hover = {};
        },
        onClick(e) {
            this.cancelEvent(e);

            this.selected = this.getNodeInfo(e.target);
            this.send({ command: 'selectNode', type: this.selected.type, tagName: this.selected.tagName });
        },
        send(data) {
            console.info('[vusion:designer] Send: ' + JSON.stringify(data));
            window.parent.postMessage({ protocol: 'vusion', sender: 'designer', data }, '*');
        },
    },
};
</script>
