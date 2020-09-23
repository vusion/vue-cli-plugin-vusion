import Vue from 'vue';
import './dragEvents';
// import './designer.css';

import Helper from './helper.vue';
import '../components/d-ctrl/inject';

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

window.addEventListener('message', (e) => {
    const data = e.data;
    const protocol = data.protocol;
    if (protocol === 'health') {
        if (parent) {
            parent.postMessage({
                protocol: 'health',
                data: {
                    href: location.href,
                },
            }, '*');
        }
    }
});
