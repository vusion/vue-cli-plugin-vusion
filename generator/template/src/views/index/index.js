import Vue from 'vue';

import { install } from 'vusion-utils';
import * as Components from '@/components';
install(Vue, Components);

import Index from './index.vue';
new Vue(Index).$mount('#app');
