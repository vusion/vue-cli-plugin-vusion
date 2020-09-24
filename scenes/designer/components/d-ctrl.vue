<template>
<div :class="$style.root">
    <span @click="$emit('close')">关闭</span>
    <span @click="$emit('remove')">删除</span>
</div>
</template>
<script>
export default {
};
</script>
<style module>
    .root {
        position: absolute;
        left: 0;
        top: -21px;
        color: #fff;
        cursor: pointer;
        height: 20px;
    }
    .root span {
        display: inline-block;
        margin-right: 4px;
        background: #4a88e8;
        line-height: 20px;
        padding: 0 4px;
    }
</style>
