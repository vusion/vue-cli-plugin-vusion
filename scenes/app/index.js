import Vue from 'vue';
import VueRouter from 'vue-router';
import 'themeCSS';
import * as Library from 'cloud-ui.vusion';
import { install } from '@vusion/utils';
import '@/global/styles/theme.css';
import '@/global/features/page-init';
import '@/global/styles/index.css';

import installServices from '@/global/features/service/install';

Vue.use(VueRouter);
install(Vue, Library);
Vue.use(installServices);

const Index = Vue.extend({
    template: '<div><router-view></router-view></div>',
});
const router = new VueRouter({
    routes: [
        { path: '/', component: Index },
        { path: '*', component: Index },
    ],
});

const app = new Vue({
    name: 'app',
    router,
    template: '<router-view></router-view>',
});
app.$mount('#app');
