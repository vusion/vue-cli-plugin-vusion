import Vue from 'vue';

import VueRouter from 'vue-router';
Vue.use(VueRouter);

import CodeExamplePlugin from './CodeExamplePlugin';
Vue.use(CodeExamplePlugin);

import { install } from 'vusion-utils';

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
/* DEFAULT_PROJECT start */
import 'baseCSS';
import * as Library from '@@';
if ($docs.install === 'option-name') {
    Object.keys(Library).forEach((key) => {
        const Component = Library[key];
        const name = typeof Component === 'function' ? Component.options.name : Component.name;
        name && Vue.component(name, Component);
    });
} else
    install(Vue, Library);
/* DEFAULT_PROJECT end */
/* MATERIAL_LIBRARY start */
// import 'baseCSS';
// import * as Library from '@@';
// // install(Vue, CloudUI);
// if ($docs.install === 'option-name') {
//     Object.keys(Library).forEach((key) => {
//         const Component = Library[key];
//         const name = typeof Component === 'function' ? Component.options.name : Component.name;
//         name && Vue.component(name, Component);
//     });
// } else
//     install(Vue, Library);
/* MATERIAL_LIBRARY end */
/* COMPONENT_PACKAGE start */
import '@@/../dist/index.css';
import '../styles/vue-package.css';
import * as CLibraryDist from '@@/../dist';
install(Vue, CLibraryDist);
import * as Components from '@';
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
/* COMPONENT_PACKAGE end */
/* BLOCK_PACKAGE start */
import '@@/../dist/index.css';
import '../styles/vue-package.css';
import * as BLibraryDist from '@@/../dist';
install(Vue, BLibraryDist);
import * as Blocks from '@';
if (Object.keys(Blocks).length > 1)
    install(Vue, Blocks);
else {
    const name = ((packageName) => {
        const cap = /([a-zA-Z0-9-_]+)(\.vue)?$/.exec(packageName);
        return (cap ? cap[1] : packageName).replace(/(?:^|-)([a-zA-Z0-9])/g, (m, $1) => $1.toUpperCase());
    })($docs.package.name);
    install(Vue, { [name]: Blocks.default });
}
$docs.routes[0] = $docs.routes[0].children[1].children[1];
$docs.routes[0].path = '/';
/* BLOCK_PACKAGE end */

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

document.title = $docs.title || 'Vusion 组件库';

new Vue({
    router: new VueRouter({
        mode: $docs.mode,
        base: $docs.base,
        routes: $docs.routes,
        scrollBehavior: (to, from, savedPosition) => savedPosition || { x: 0, y: 0 },
    }),
}).$mount('#app');
