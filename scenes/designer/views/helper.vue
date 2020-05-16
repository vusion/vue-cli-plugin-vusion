<template>
<div>
    <d-highlighter :el="hoveredEl"></d-highlighter>
    <d-highlighter mode="select" :el="selectedEl"></d-highlighter>
</div>
</template>

<script>
export default {
    data() {
        return {
            hoveredEl: undefined,
            selectedEl: undefined,
        };
    },
    watch: {
        $route() {
            this.hoveredEl = undefined;
            this.selectedEl = undefined;
        },
    },
    mounted() {
        document.addEventListener('mouseover', this.onMouseOver);
        document.addEventListener('mouseleave', this.onMouseLeave);
        document.addEventListener('click', this.onClick);
    },
    destroyed() {
        document.removeEventListener('mouseover', this.onMouseOver);
        document.removeEventListener('mouseleave', this.onMouseLeave);
    },
    methods: {
        onMouseOver(e) {
            // console.log(e.target);
            this.hoveredEl = e.target;
        },
        onMouseLeave(e) {
            this.hoveredEl = undefined;
        },
        onClick(e) {
            this.selectedEl = e.target;
        },
    },
};
</script>
