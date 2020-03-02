import Vue from 'vue';

import VueRouter from 'vue-router';
Vue.use(VueRouter);

import './designer.css';
import '@/global/styles/theme.css';
import '@/global/page';
import '@/views/dashboard/library'; // @TODO
import '@/global/styles/index.css';

import $designer from './empty';
Vue.prototype.$designer = $designer;
Vue.prototype.NODE_ENV = process.env.NODE_ENV;
if (process.env.NODE_ENV === 'development')
    window.$designer = $designer; // 方便开发时调试

new Vue({
    router: new VueRouter({
        // mode: $docs.mode,
        // base: $docs.base,
        routes: $designer.routes,
        scrollBehavior: (to, from, savedPosition) => savedPosition || { x: 0, y: 0 },
    }),
}).$mount('#app');
