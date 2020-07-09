<template>
<div :class="$style.root">
    <u-spinner :class="$style.spinner"></u-spinner> 正在添加 <strong>{{ title }}</strong> {{ type }}，请稍候...
</div>
</template>

<script>
export default {
    name: 'd-progress',
    props: {
        type: { type: String, default: '组件' },
        title: String,
    },
};
</script>

<style module>
.root {
    text-align: left;
    padding: 10px;
    margin: 10px 0;
    background: #fffae8;
    border: 1px solid #ffeca2;
    color: #b98000;
}
.spinner {
    margin-right: 4px;
}
</style>
