import Vue from 'vue';
import VueRouter from 'vue-router';

Vue.use(VueRouter);

const Index = {
    template: '<div><div>123</div><router-view></router-view></div>',
};
const router = new VueRouter({
    routes: [
        { path: '/', component: Index, children: [
            { path: '', redirect: 'user' },
            { path: 'user', component: {
                template: '<div>User1</div>',
            } },
        ] },
        { path: '*', component: Index },
    ],
});

const app = new Vue({
    name: 'app',
    router,
    template: '<div>test1<router-view></router-view></div>',
});
app.$mount('#app');
