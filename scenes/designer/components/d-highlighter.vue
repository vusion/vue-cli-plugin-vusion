<template>
<div v-show="rectStyle" :class="$style.root" :mode="mode" :style="rectStyle"
    :tabindex="mode === 'selected' ? 0 : ''" @keyup="onKeyUp">
    <div :class="$style.bar">
        <span :class="$style.tag">{{ info.tag }}</span>
        <!-- <span :class="$style.icon" role="add"></span>
        <span :class="$style.icon" role="duplicate"></span> -->
        <span :class="$style.icon" role="remove" @click="remove"></span>
    </div>
</div>
</template>

<script>
export default {
    name: 'd-highlighter',
    props: {
        mode: { type: String, default: 'hover' },
        info: Object,
    },
    data() {
        return {
            rectStyle: undefined,
        };
    },
    watch: {
        info: {
            handler(info) {
                this.computeStyle();
            },
            immediate: true,
        },
    },
    mounted() {
        window.addEventListener('scroll', this.onAnyScroll, true);
    },
    destroyed() {
        window.addEventListener('scroll', this.onAnyScroll, true);
    },
    methods: {
        computeStyle() {
            const el = this.info.el;
            if (el && el.nodeType === 1) {
                const rect = el.getBoundingClientRect();
                this.rectStyle = {
                    top: rect.top + 'px',
                    left: rect.left + 'px',
                    width: rect.width + 'px',
                    height: rect.height + 'px',
                };
            } else {
                this.rectStyle = undefined;
            }
        },
        onAnyScroll() {
            if (this.rectStyle) {
                this.computeStyle();
            }
        },
        onKeyUp(e) {
            if (e.key === 'Backspace' || e.key === 'Delete')
                this.remove();
        },
        remove() {
            const nodeInfo = this.info;
            if (nodeInfo.el === this.$parent.contextVM.$el) {
                this.$parent.send({
                    command: 'toast',
                    message: '页面根节点不能删除！',
                });
                return;
            }

            this.$parent.send({
                command: 'removeNode',
                type: nodeInfo.type,
                tag: nodeInfo.tag,
                scopeId: nodeInfo.scopeId,
                nodePath: nodeInfo.nodePath,
            });
        },
    },
};
</script>

<style module>
.root {
    position: fixed;
    top: 0;
    left: 0;
    width: 200px;
    height: 200px;
    z-index: 99999999;
    border: 1px solid white;
    outline: 1px dashed #4a88e8;
    outline-offset:  -1px;
    pointer-events: none;
}

.root[mode="selected"] {

}

.root[mode="hover"] {
    opacity: 0.5;
}

.bar {
    position: absolute;
    top: -20px;
    right: -1px;
    background: #4a88e8;
    padding: 0 4px;
    font-size: 12px;
    color: white;
    white-space: nowrap;
    pointer-events: auto;
}

.icon {
    margin-left: 4px;
    opacity: 0.5;
    transition: opacity 0.2s;
    cursor: pointer;
}

.icon:hover {
    opacity: 1;
}

.icon::before {
    icon-font: url('../assets/delete.svg');
}
</style>
