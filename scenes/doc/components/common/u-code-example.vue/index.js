import '../atom-one-light.css';
import { formatValue } from '../u-data-view-node.vue/utils';
import { utils } from 'cloud-ui';
import { getParameters } from 'codesandbox/lib/api/define';

export default {
    name: 'u-code-example',
    props: {
        title: { type: String, default: 'EXAMPLE' },
        showCode: { type: Boolean, default: false },
        showDetail: { type: Boolean, default: false },
        // disableDetail: { type: Boolean, default: false },
        filePath: String,
    },
    data() {
        let baseLink = this.$docs.github;
        if (baseLink) {
            let branch = 'master';
            if (baseLink.includes('#')) {
                const arr = baseLink.split('#');
                baseLink = arr[0];
                branch = arr[1];
            }
            baseLink = baseLink.replace(/\/$/, '') + '/tree/' + branch;
        }

        return {
            currentShowCode: this.showCode,
            copySucceeded: false,
            currentShowDetail: this.showDetail,
            githubLink: baseLink ? baseLink + '/' + this.filePath : false,
            anondemoData: {},
            logs: [],
            codesandboxData: '',
        };
    },
    watch: {
        showCode(showCode) {
            this.currentShowCode = showCode;
        },
        showDetail(showDetail) {
            this.currentShowDetail = showDetail;
        },
    },
    methods: {
        toggleShowCode() {
            this.currentShowCode = !this.currentShowCode;
            this.$emit('update:showCode', this.currentShowCode);
        },
        copyCode() {
            this.copySucceeded = utils.copy(this.$refs.code.innerText);
            setTimeout(() => this.copySucceeded = false, 600);
        },
        toggleShowDetail() {
            // if (this.disableDetail)
            //     return;
            this.currentShowDetail = !this.currentShowDetail;
            this.$emit('update:showDetail', this.currentShowDetail);
        },
        logEvent(vm, eventName, payload) {
            if (!this.currentShowDetail)
                return;

            if (this.logs.length >= 100)
                this.logs.shift();
            this.logs.push({
                type: 'event',
                eventName,
                sender: vm.$options.name,
                payload: formatValue(payload[0]),
                time: new Date().toTimeString().split(' ')[0],
            });
            this.$nextTick(() => {
                this.$refs.log && (this.$refs.log.scrollTop = this.$refs.log.scrollHeight);
            });
        },
        clearLogs() {
            this.logs = [];
        },
        openCodesandbox() {
            const content = this.$refs.code.innerText.trim();
            this.codesandboxData = getParameters({
                files: {
                    'package.json': {
                        content: {
                            scripts: {
                                serve: 'vue-cli-service serve',
                                build: 'vue-cli-service build',
                                lint: 'vue-cli-service lint',
                            },
                            dependencies: {
                                'vusion-utils': 'latest',
                                vue: '^2.6.10',
                                'vue-template-compiler': '^2.6.10',
                                'cloud-ui.vusion': '^0.6.14',
                            },
                            devDependencies: {
                                '@vue/babel-preset-app': '^3.11.0',
                                '@vue/cli-plugin-babel': '4.1.1',
                                '@vue/cli-plugin-eslint': '4.1.1',
                                '@vue/cli-service': '4.1.1',
                                'vue-cli-plugin-vusion': '^0.9.4',
                                'babel-eslint': '^10.0.3',
                                eslint: '^6.7.2',
                                'eslint-plugin-vue': '^6.0.1',
                                'vue-template-compiler': '^2.6.11',
                            },
                        },
                    },
                    'src/App.vue': {
                        content: content.trim().startsWith('<template') ? content : `<template><div>${content}</div></template>`,
                    },
                    'src/index.js': {
                        content:
`import Vue from "vue";
import "cloud-ui.vusion/src/styles/base.css";
import "cloud-ui.vusion/src/styles/theme.css";
import "cloud-ui.vusion/dist-raw/index.css";
import * as CloudUI from "cloud-ui.vusion/dist-raw/index.js";
import Main from "./App.vue";
import { install } from "vusion-utils";
install(Vue, CloudUI);
const Ctor = Vue.extend(Main);
new Ctor().$mount("#app");`,
                    },
                    'index.html': {
                        content:
`<style>
    #container {
        padding: 20px; min-width: 200px; min-height: 200px;
    }
</style>
<div id="container">
    <div id="app">
</div>
</div>`,
                    },
                },
            });
            this.$nextTick(() => {
                this.$refs.codesandbox.submit();
            });
        },
    },
};
