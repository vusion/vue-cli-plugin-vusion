<template>
<div :class="$style.root" @click="$emit('click')">关闭</div>
</template>
<script>
export default {

};
</script>
<style module>
    .root {
        position: absolute;
        left: 0;
        top: -20px;
        background: #4a88e8;
        line-height: 20px;
        padding: 0 4px;
        color: #fff;
        cursor: pointer;
        height: 20px;
    }
</style>
