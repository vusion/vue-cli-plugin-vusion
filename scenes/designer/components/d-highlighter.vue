<template>
<div v-show="rectStyle" :class="$style.root" :mode="mode" :style="rectStyle">
    <div :class="$style.overlay" ref="overlay"></div>
</div>
</template>

<script>
export default {
    name: 'd-highlighter',
    props: {
        mode: { type: String, default: 'hover' },
        el: [HTMLElement, HTMLDocument],
    },
    data() {
        return {
            rectStyle: undefined,
        };
    },
    watch: {
        el: {
            handler(el) {
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
            immediate: true,
        },
    },
    // methods: {
    //     highlight(el) {

    //     },
    //     select(el) {
    //         const rect = el.getBoundingClientRect();
    //         this.rectStyle = {
    //             top: rect.top + 'px',
    //             left: rect.left + 'px',
    //             width: rect.width + 'px',
    //             height: rect.height + 'px',
    //         };
    //     },
    // },
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
    border: 1px solid hsla(216, 77%, 60%, 0.4);
    pointer-events: none;
}

.root[mode="select"] {
    border-color: #4a88e8; /* #67a2ff; */
}
</style>
