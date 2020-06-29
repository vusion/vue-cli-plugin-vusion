<template>
<div :class="$style.root" :vusion-node-path="nodePath" router-view><router-view></router-view></div>
</template>

<script>
export default {
    props: {
        nodePath: String,
    },
};
</script>

<style module>
.root:empty {
    min-height: 20px;
}
</style>
