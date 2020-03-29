<template>
<div :class="$style.root" v-tooltip.top="copySucceeded ? '复制成功' : tooltip" @click="onClick" @dblclick="onDblClick">
    <div :class="$style.icon">
        <component :is="icon" :name="name"></component>
        <slot></slot>
    </div>
    <div :class="$style.name">{{ name }}</div>
</div>
</template>

<script>
import { utils } from 'cloud-ui';

export default {
    props: {
        icon: { type: String, default: 'i-icon' },
        name: { type: String, default: 'arrow' },
    },
    data() {
        return {
            tooltip: '单击复制`icon-font`属性，双击复制组件标签',
            copySucceeded: false,
        };
    },
    methods: {
        onClick() {
            const packageName = this.$docs.package && this.$docs.package.name;
            const prefix = packageName ? `${packageName}/src/components/${this.icon}.vue` : `${this.icon}.vue`;
            this.copySucceeded = utils.copy(`icon-font: url('${prefix}/assets/${this.name}.svg');`);
            setTimeout(() => this.copySucceeded = false, 600);
        },
        onDblClick() {
            this.copySucceeded = utils.copy(`<${this.icon} name="${this.name}"></${this.icon}>`);
            setTimeout(() => this.copySucceeded = false, 600);
        },
    },
};
</script>

<style module>
.root {
    display: inline-block;
    width: 120px;
    vertical-align: top;
    text-align: center;
    margin-top: 5px;
    margin-right: 10px;
    margin-bottom: 15px;
    border: 1px solid transparent;
    border-radius: 3px;
    cursor: var(--cursor-pointer);
}

.root:hover {
    border-color: #e9eef5;
    box-shadow: 0 2px 10px rgba(90,95,100,0.12);
}

.icon {
    font-size: 32px;
    padding: 4px;
    padding-bottom: 0;
}

.name {
    font-size: 12px;
    padding: 4px;
    color: #a3adbb;
}

.root:hover .name {
    color: inherit;
}
</style>
