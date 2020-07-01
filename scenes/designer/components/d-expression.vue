<template>
<span :class="$style.root" tabindex="0" @focus="onFocus" @click="cancelEvent">
    <span v-if="!editable" key="noEdit" :class="$style.noeidt">
        <slot></slot>
    </span>
    <span v-else key="edit" ref="editbox" :class="$style.edit" contenteditable="true" tabindex="0" @blur="onBlur" @keydown="onKeyDown">{{ name }}</span>
</span>
</template>

<script>
export default {
    name: 'd-expression',
    props: {
        type: Number,
        name: String,
        nodePath: String,
    },
    data() {
        return {
            editable: false,
        };
    },
    methods: {
        cancelEvent(event) {
            event.stopImmediatePropagation();
            event.preventDefault();
        },
        onFocus(event) {
            this.editable = true;
            this.$nextTick(() => {
                this.$refs.editbox && (this.$refs.editbox.focus());
            });
        },
        onBlur(event) {
            this.send({
                command: 'saveText',
                nodePath: this.nodePath,
                value: event.target.innerText,
            });
            this.editable = false;
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
.root{
    display: inline-block;
}
.edit:focus{
    outline: 1px dashed #4a88e8;
}
.root:empty, .edit:empty{
    width: 10px;
}
.noeidt{
    display: inline-block;
    min-width:10px;
    min-height: 14px;
}
.root:hover .noeidt{
    outline: 1px dashed #4a88e8;
}
</style>
