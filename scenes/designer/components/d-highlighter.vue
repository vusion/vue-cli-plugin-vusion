<template>
<div v-show="rectStyle" :class="$style.root" :mode="mode" :style="rectStyle">
    <div :class="$style.tagName">{{ info.tagName }}</div>
    <div :class="$style.overlay" ref="overlay"></div>
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
    z-index: 9999999999;
    border: 1px solid white;
    outline: 1px dashed #4a88e8;
    outline-offset:  -1px;
    pointer-events: none;
}

.tagName {
    position: absolute;
    top: -20px;
    right: -1px;
    background: #4a88e8;
    padding: 0 8px;
    font-size: 12px;
    color: white;
    white-space: nowrap;
}

.root[mode="hover"] {
    opacity: 0.5;
}
</style>
