<template>
<span
    :class="$style.root"
    :vusion-node-path="nodePath"
    :vusion-parent-node-path="parentNodePath"
    @dblclick="onDblclick">
    <!-- <slot>{{ text }}</slot> -->
    {{ name }}
</span>
</template>

<script>
export default {
    name: 'd-placeholder',
    props: {
        text: String,
        name: String,
        nodePath: String,
        parentNodePath: String,
    },
    methods: {
        onDblclick() {
            this.send({
                command: 'editExpression',
                nodePath: this.nodePath,
                value: this.name,
            });
        },
        send(data) {
            return this.$root.$emit('d-slot:send', data);
        },
    },
};
</script>

<style module>
.root{
    background: #ddd;
    display: inline-block;
    min-width:10px;
    cursor: pointer !important;
}
</style>
