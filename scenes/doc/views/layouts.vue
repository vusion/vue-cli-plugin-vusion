<template>
<s-materials-view type="layouts" :groups="groups"></s-materials-view>
</template>

<script>
export default {
    data() {
        return { groups: this.$docs.layoutsGroups };
    },
};
</script>
