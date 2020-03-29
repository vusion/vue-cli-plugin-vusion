<template>
<u-linear-layout gap="small">
    <u-label v-for="label in labels" :key="label" v-tooltip.top="tooltips[label]">{{ label }}</u-label>
</u-linear-layout>
</template>

<script>
export default {
    props: {
        labels: Array,
    },
    data() {
        return {
            tooltips: {
                // 组件类型
                'UI 组件': '通用 UI 组件',
                图标组件: '包含一系列图标的组件',
                布局组件: '布局组件',
                // 组件特性
                表单控件: '该组件继承自 MField，常用于表单中，与 UFormItem、UValidator 等组件结合可以进行表单验证',
                表单验证器: '该组件为 UValidator 或者继承自 UValidator，可以对内部表单验证器或控件进行递归验证',
                路由链接: '该组件可以方便添加链接或路由，类似`<router-link>`。具有 href、target、to 等属性，以及 @navigation 和 @before-navigation 事件',
                // 展示方式
                行内展示: '默认为行内元素。如需切换为块级展示，请添加属性`display="block"`',
                块级展示: '默认为块级元素。如需切换为行内展示，请添加属性`display="inline"`',
            },
        };
    },
};
</script>
