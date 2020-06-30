<template>
<div :class="$style.root" :vusion-node-path="nodePath" router-view><router-view></router-view></div>
</template>

<script>
export default {
    name: 'd-router-view',
    props: {
        nodePath: String,
    },
};
</script>

<style module>
.root:empty {
    background: linear-gradient(-45deg, white 25%,
    rgba(138, 205, 78, 0.25) 25%, rgba(138, 205, 78, 0.25) 50%,
    white 50%, white 75%,
    rgba(138, 205, 78, 0.25) 75%);
    background-size: 20px 20px;
    min-height: 20px;
}
</style>
