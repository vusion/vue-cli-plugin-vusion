<template>
<div :class="$style.root">
    <u-spinner :class="$style.loading"></u-spinner><u-text> {{ name }} 正在安装，请稍候...</u-text>
</div>
</template>

<script>
export default {
    name: 'd-progress',
    props: {
        name: String,
    },
};
</script>

<style module>
.root {
    text-align: left;
    padding: 10px;
    margin: 10px 0;
    background: #ebf2fc;
}
.loading {
    margin-right: 4px;
}
</style>
