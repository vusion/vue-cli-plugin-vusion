import Vue from 'vue';
import VueRouter from 'vue-router';
import 'themeCSS';
import * as Library from 'cloud-ui.vusion';
import { install, installFilters, installComponents } from '@vusion/utils';
import '@/global/styles/theme.css';
import '@/global/features/page-init';
import '@/global/styles/index.css';

install(Vue, Library);

import * as Components from '@/global/components';
import filters from '@/global/features/common/filters';

installFilters(Vue, filters);
installComponents(Vue, Components);

import initApp from './initApp';
import installServices from '@/global/features/service/install';
import installDataTypes from '@/global/features/dataTypes/install';
import installUtils from '@/global/features/utils/install';
import { initMiddleware } from '@/global/middleware';
import GueryStrCollect from '@/global/features/apollo/queryStrCollect';

Vue.use(VueRouter);
Vue.use(installServices);
Vue.use(installDataTypes);
Vue.use(installUtils);
Vue.use(GueryStrCollect);

const Index = Vue.extend({
    template: `<div style="background: #111217;height:calc(100vh - 40px);position:relative;opacity: 0.8;">
                <u-loading style="position: absolute;width:48px;height:48px;top:calc(50% - 24px);left:calc(50% - 24px);"></u-loading>
                <router-view></router-view>
            </div>`,
});
const router = new VueRouter({
    routes: [
        { path: '/', component: Index },
        { path: '*', component: Index },
    ],
});

const app = initApp(router);
app.$mount('#app');
document.getElementById('loading').style.display = 'none';
