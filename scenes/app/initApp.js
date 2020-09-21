import Vue from 'vue';
import { apolloProvider } from '@/global/features/apollo';

export default function initApp(router) {
    return new Vue({
        name: 'app',
        apolloProvider,
        router,
        template: '<router-view></router-view>',
    });
}
