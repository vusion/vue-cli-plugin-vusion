<template>
<span :class="$style.root" contenteditable="true" tabindex="1" @blur="onBlur" @keydown="onKeyDown" @click="cancelEvent" :vusion-node-path="nodePath" :vusion-parent-node-path="parentNodePath">{{ text }}</span>
</template>

<script>
export default {
    props: {
        type: Number,
        text: String,
        nodePath: String,
        parentNodePath: String,
    },
    methods: {
        cancelEvent(event) {
            event.stopImmediatePropagation();
            event.preventDefault();
        },
        onBlur(event) {
            this.send({
                command: 'saveText',
                nodePath: this.nodePath,
                value: event.target.innerText,
            });
        },
        onKeyDown(event) {
            if (event.keyCode === 13) {
                this.cancelEvent(event);
                this.onBlur(event);
            }
        },
        send(data) {
            return this.$root.$emit('d-slot:send', data);
        },
    },
};
</script>

<style module>
.root:focus{
    outline: 1px dashed #4a88e8;
}
.root:empty{
    width: 10px;
}
</style>
