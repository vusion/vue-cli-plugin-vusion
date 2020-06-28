<template>
<div :vusion-node-path="nodePath" router-view><router-view></router-view></div>
</template>

<script>
export default {
    props: {
        nodePath: String,
    },
};
</script>
