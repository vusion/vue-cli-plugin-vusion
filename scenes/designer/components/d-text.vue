<template>
<span :class="$style.root"
    contenteditable="true"
    tabindex="1"
    @blur="onBlur"
    @keydown="onKeyDown"
    @click="cancelEvent"
    :vusion-node-path="nodePath"
    :vusion-parent-node-path="parentNodePath"
    :vusion-slot-name="slotName">{{ text }}</span>
</template>

<script>
export default {
    name: 'd-text',
    props: {
        text: String,
        nodePath: String,
        parentNodePath: String,
        slotName: String,
    },
    methods: {
        cancelEvent(event) {
            event.stopImmediatePropagation();
            event.preventDefault();
        },
        onBlur(event) {
            this.$emit('d-text:blur', this);
            const value = event.target.innerText;
            if (value === this.text)
                return;
            if (this.slotName) {
                this.send({
                    command: 'saveAttrs',
                    nodePath: this.parentNodePath,
                    value,
                    attrKey: this.slotName,
                });
            } else {
                this.send({
                    command: 'saveText',
                    nodePath: this.nodePath,
                    value,
                });
            }
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
.root:empty:before{
    content:'X';
    opacity: 0;
}
</style>
