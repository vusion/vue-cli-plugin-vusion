import Vue from 'vue';

import VueRouter from 'vue-router';
Vue.use(VueRouter);

import CodeExamplePlugin from './CodeExamplePlugin';
Vue.use(CodeExamplePlugin);

import { install } from 'vusion-utils';

import * as CloudUI from 'cloud-ui.vusion';
install(Vue, CloudUI);

// 自动注册本地组件
const requires = require.context('../components/', true, /\.vue$/);
requires.keys().forEach((key) => {
    if (key.indexOf('.vue') !== key.lastIndexOf('.vue'))
        return;
    const name = requires(key).default.name || key.slice(key.lastIndexOf('/') + 1, key.lastIndexOf('.'));
    Vue.component(name, requires(key).default);
});

import '../styles/vue-package.css';

export default ($docs, Components) => {
    Vue.prototype.$docs = $docs;
    Vue.prototype.NODE_ENV = process.env.NODE_ENV;
    if (process.env.NODE_ENV === 'development')
        window.$docs = $docs; // 方便开发时调试

    if (Object.keys(Components).length > 1)
        install(Vue, Components);
    else {
        const name = ((packageName) => {
            const cap = /([a-zA-Z0-9-_]+)(\.vue)?$/.exec(packageName);
            return (cap ? cap[1] : packageName).replace(/(?:^|-)([a-zA-Z0-9])/g, (m, $1) => $1.toUpperCase());
        })($docs.package.name);
        install(Vue, { [name]: Components.default });
    }
    $docs.routes[0] = $docs.routes[0].children[1].children[1];
    $docs.routes[0].path = '/';

    new Vue({
        router: new VueRouter({
            mode: $docs.mode,
            base: $docs.base,
            routes: $docs.routes,
            scrollBehavior: (to, from, savedPosition) => savedPosition || { x: 0, y: 0 },
        }),
    }).$mount('#app');
};
