<template>
<span :class="$style.root">{{ text }}</span>
</template>

<script>
export default {
    props: {
        type: Number,
        text: String,
    },
};
</script>

<style module>
.root {}
</style>
