import Vue from 'vue';
import './dragEvents';
// import './designer.css';

import Helper from './helper.vue';

// 自动注册本地组件
const requires = require.context('../components/', true, /\.vue$/);
requires.keys().forEach((key) => {
    if (key.indexOf('.vue') !== key.lastIndexOf('.vue'))
        return;
    const options = requires(key).default;
    const name = options.name || key.slice(key.lastIndexOf('/') + 1, key.lastIndexOf('.'));
    Vue.component(name, options);
    if (options.install)
        options.install(Vue, name);
});

const div = document.createElement('div');
document.body.append(div);
new Vue(Helper).$mount(div);

// import $designer from './empty';
// Vue.prototype.$designer = $designer;
// Vue.prototype.NODE_ENV = process.env.NODE_ENV;
// if (process.env.NODE_ENV === 'development')
//     window.$designer = $designer; // 方便开发时调试

// const router = new VueRouter({
//     // mode: $docs.mode,
//     // base: $docs.base,
//     routes: $designer.routes,
//     scrollBehavior: (to, from, savedPosition) => savedPosition || { x: 0, y: 0 },
// });

// const appVM = new Vue({
//     router,
// }).$mount('#app');

// helperVM.appVM = appVM;
// router.afterEach((to, from) => helperVM.$emit('route', to, from));
