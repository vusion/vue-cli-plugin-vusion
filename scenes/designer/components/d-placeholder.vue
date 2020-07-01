<template>
<span :vusion-node-path="nodePath" :vusion-parent-node-path="parentNodePath"><slot>{{ text }}</slot></span>
</template>

<script>
export default {
    name: 'd-placeholder',
    props: {
        text: String,
        nodePath: String,
        parentNodePath: String,
    },
};
</script>
