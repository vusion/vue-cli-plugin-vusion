<template>
<div :class="$style.root"></div>
</template>

<script>
export default {
    name: 'd-skeleton',
};
</script>

<style module>
.root {
    /* border: 2px dashed #d5dadf; */
    background: #eef2f7;
    transition: all 0.2s;
    height: 32px;
}

.root[display="inline"] {
    display: inline-block;
    vertical-align: top;
    min-width: 80px;
}

.root[color="light"] {
    background: #f4f6f9;
}
</style>
