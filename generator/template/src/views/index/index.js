import Vue from 'vue';

import { install } from 'vusion-utils';
import * as Components from '@/components';
install(Vue, Components);
import 'baseCSS';

import Index from './index.vue';
new Vue({
    el: '#app',
    render: (h) => h(Index),
});
