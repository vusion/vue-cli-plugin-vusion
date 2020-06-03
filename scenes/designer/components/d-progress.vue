<template>
<div :class="$style.root">
    <u-loading size="small" :class="$style.loading"></u-loading><u-text>{{name}} 正在安装，请稍候...</u-text>
</div>
</template>

<script>
export default {
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
    background: aliceblue;
}
.loading{
    margin-right: 5px;
}
</style>
