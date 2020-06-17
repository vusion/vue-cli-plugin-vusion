<template>
<span :class="$style.root" contenteditable="true" tabindex="1" @blur="onBlur" @keydown="onKeyDown">{{ text }}</span>
</template>

<script>
export default {
    props: {
        type: Number,
        text: String,
        nodePath: String,
    },
    methods:{
        onBlur(event){
            this.send({
                command: 'saveText',
                nodePath: this.nodePath,
                value: event.target.innerText,
            });
        },
        onKeyDown(event){
            if(event.keyCode === 13){
                event.preventDefault();
                this.onBlur(event);
            }
        },
        send(data) {
            return this.$root.$emit('d-slot:send', data);
        },
    }
};
</script>

<style module>
.root:focus{
    outline: 1px dashed #4a88e8;
    padding: 0 2px;
}
</style>
