<template>
<s-materials-view type="misc" :groups="groups" :camel-name="false"></s-materials-view>
</template>

<script>
export default {
    data() {
        return { groups: this.$docs.miscGroups };
    },
};
</script>
