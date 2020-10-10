<template>
<span :class="$style.root"
    @dblclick="onDblclick"
    :vusion-node-path="nodePath"
    :vusion-parent-node-path="parentNodePath"
    :vusion-slot-name="slotName">
    <span v-if="!contenteditable" key="noEdit" :class="$style.noedit">{{ text }}</span>
    <span v-else contenteditable="true" tabindex="0" key="edit"
        @blur="onBlur"
        @keydown="onKeyDown"
        ref="edit" focus="true">{{ text }}</span>
</span>
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
    data() {
        return {
            contenteditable: false,
        };
    },
    methods: {
        onBlur(event) {
            this.contenteditable = false;
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
                // this.onBlur(event);
                this.$refs.edit.blur();
            }
        },
        send(data) {
            return this.$root.$emit('d-slot:send', data);
        },
        onDblclick(event) {
            event.stopImmediatePropagation();
            event.preventDefault();
            this.contenteditable = true;
            this.$nextTick(() => {
                this.$refs.edit && (this.$refs.edit.focus());
            });
        },
    },
};
</script>

<style module>
.root{
    cursor: pointer !important;
}
.root .noedit{}
.root span:focus{
    outline:none;
}
.root span[contenteditable="true"]:focus{
    outline: 1px dashed #4a88e8;
}
.root span[contenteditable="true"]:empty:before{
    content:'X';
    opacity: 0;
}
</style>
