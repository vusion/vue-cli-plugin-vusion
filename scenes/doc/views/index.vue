<template>
<l-page>
    <u-navbar slot="head">
        <u-logo slot="left">{{ logo }}</u-logo>
        <u-navbar-item v-for="item in navbar" :key="item.text" :to="item.to" :href="item.href" :target="item.target">{{ item.text }}</u-navbar-item>
    </u-navbar>
    <router-view></router-view>
</l-page>
</template>

<script>
export default {
    data() {
        return {
            logo: this.$docs.logo,
            navbar: this.$docs.navbar,
            theme: window.theme,
        };
    },
    methods: {
        onSelectTheme($event) {
            if ($event.value !== window.theme) {
                localStorage.setItem('theme', $event.value);
                location.reload();
            }
        },
    },
};
</script>
