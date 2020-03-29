<template>
<div :class="$style.root" :style="{ background: value }"
     v-tooltip.top="copySucceeded ? '复制成功' : tooltip"
     @click="onClick" @dblclick="onDblClick">
    <slot></slot>
    <div :class="$style.name">{{ name }}</div>
</div>
</template>

<script>
import { utils } from 'cloud-ui';

export default {
    name: 'u-color-scheme',
    props: {
        name: String,
        value: String,
    },
    data() {
        return {
            tooltip: '单击复制变量，双击色彩值',
            copySucceeded: false,
        };
    },
    methods: {
        onClick() {
            this.copySucceeded = utils.copy(this.name);
            setTimeout(() => this.copySucceeded = false, 600);
        },
        onDblClick() {
            this.copySucceeded = utils.copy(this.value);
            setTimeout(() => this.copySucceeded = false, 600);
        },
    },
};
</script>

<style module>
.root {
    position: relative;
    height: 80px;
}

.root:hover {
    border-color: #e9eef5;
    box-shadow: 0 2px 10px rgba(90,95,100,0.12);
}

.name {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    background: rgba(0,0,0,0.4);
    font-size: 12px;
    color: white;
    padding: 2px 4px;
    /* opacity: 0; */
    transition: opacity var(--transition-duration-base);
}

.root:hover .name {
    opacity: 1;
}
</style>
