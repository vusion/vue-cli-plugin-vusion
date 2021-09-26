import Vue from 'vue';

import VueRouter from 'vue-router';
Vue.use(VueRouter);

import CodeExamplePlugin from './CodeExamplePlugin';
Vue.use(CodeExamplePlugin);

import { install } from '@vusion/utils';

// 自动注册本地组件
const requires = require.context('../components/', true, /\.vue$/);
requires.keys().forEach((key) => {
    if (key.indexOf('.vue') !== key.lastIndexOf('.vue'))
        return;
    const name = requires(key).default.name || key.slice(key.lastIndexOf('/') + 1, key.lastIndexOf('.'));
    Vue.component(name, requires(key).default);
});

import $docs from './empty';
Vue.prototype.$docs = $docs;
Vue.prototype.NODE_ENV = process.env.NODE_ENV;
if (process.env.NODE_ENV === 'development')
    window.$docs = $docs; // 方便开发时调试

import 'themeCSS';
import * as CloudUI from 'cloud-ui.vusion';
import * as Library from '@';
if ($docs.install === 'option-name') {
    Object.keys(Library).forEach((key) => {
        const Component = Library[key];
        const name = typeof Component === 'function' ? Component.options.name : Component.name;
        name && Vue.component(name, Component);
    });
} else {
    install(Vue, CloudUI);
    install(Vue, Library);
}

/* eslint-disable no-undef */
/* DOCS_COMPONENTS_PATH start */
const requires2 = require.context(DOCS_COMPONENTS_PATH, true, /\.vue$/);
requires2.keys().forEach((key) => {
    if (key.indexOf('.vue') !== key.lastIndexOf('.vue'))
        return;
    const name = requires2(key).default.name || key.slice(key.lastIndexOf('/') + 1, key.lastIndexOf('.'));
    Vue.component(name, requires2(key).default);
});
/* DOCS_COMPONENTS_PATH end */

/* DOCS_IMPORTS_PATH start */
const imports = require(DOCS_IMPORTS_PATH);
install(Vue, imports);
/* DOCS_IMPORTS_PATH end */

const router = new VueRouter({
    mode: $docs.mode,
    base: $docs.base,
    routes: $docs.routes,
    scrollBehavior: (to, from, savedPosition) => {
        if (to.hash) {
            return {
                selector: decodeURIComponent(to.hash),
            };
        }
        return savedPosition || { x: 0, y: 0 };
    },
});
router.afterEach((to, from) => {
    if (to.hash) {
        setTimeout(() => {
            const el = document.querySelector(decodeURIComponent(to.hash));
            // 处理导航栏的高度
            const navbarEl = document.querySelector('[class^=u-navbar]');
            document.documentElement.scrollTop = (el ? el.offsetTop : 0) - (navbarEl ? navbarEl.offsetHeight : 0) - 30;
        }, 300); // 延迟时间无法确定，暂时 300ms
    }
});

new Vue({
    router,
}).$mount('#app');
