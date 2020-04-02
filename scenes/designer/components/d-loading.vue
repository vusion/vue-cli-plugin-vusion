<template>
<div v-show="visible" :class="$style.root">
    <u-loading size="large"></u-loading>
</div>
</template>

<script>
import Vue from 'vue';

export default {
    name: 'd-loading',
    data() {
        return {
            visible: false,
        };
    },
    mounted() {
        document.body.appendChild(this.$el);
        if (!Vue.prototype.$loading)
            Vue.prototype.$loading = this;
    },
    destroyed() {
        document.body.removeChild(this.$el);
    },
    methods: {
        show(duration = 0) {
            this.visible = true;
            if (duration)
                setTimeout(() => this.visible = false, duration);
        },
        hide() {
            this.visible = false;
        },
    },
};
</script>

<style module>
.root {
    position: fixed;
    width: 100%;
    height: 100%;
    top: 0;
    left: 0;
    background: rgba(0, 0, 0, 0.6);
    display: flex;
    justify-content: center;
    align-items: center;
}
</style>
