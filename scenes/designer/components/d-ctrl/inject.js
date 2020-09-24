import Vue from 'vue';
import { UModal as UModalSource } from 'cloud-ui.vusion';
const normalizeSlots = (slots, context) => Object.keys(slots)
    .reduce((arr, key) => {
        slots[key].forEach((vnode) => {
            if (!vnode.context) {
                slots[key].context = context;
            }
            if (!vnode.data) {
                vnode.data = {};
            }
            vnode.data.slot = key;
        });
        return arr.concat(slots[key]);
    }, []);
Vue.component('UModal', {
    name: 'u-modal',
    i18n: UModalSource.i18n,
    components: {
        UModalSource,
    },
    props: UModalSource.props,
    data() {
        return {
            currentVisible: false,
        };
    },
    watch: {
        currentVisible(currentVisible) {
            this.$refs.modal.currentVisible = currentVisible;
        },
    },
    methods: {
        clickHandler() {
            this.$refs.modal.currentVisible = true;
        },
        closeHandler() {
            this.$refs.modal.currentVisible = false;
        },
        remove() {
            let p = this;
            while (!p.$options._scopeId) {
                p = p.$parent;
            }
            if (p) {
                this.send({
                    command: 'removeNode',
                    type: 'component',
                    tag: 'u-modal',
                    scopeId: p.$options._scopeId,
                    nodePath: this.$attrs['vusion-node-path'],
                });
            }
        },
        send(data) {
            const dataString = JSON.stringify(data);
            console.info('[vusion:designer] Send: ' + dataString); // (dataString.length > 100 ? dataString.slice(0, 100) + '...' : dataString));
            window.parent.postMessage({ protocol: 'vusion', sender: 'designer', data }, '*');
        },
    },
    render(h) {
        const ctrlSlot = h('d-ctrl', {
            on: {
                close: this.closeHandler,
                remove: this.remove,
            },
        });
        const slots = normalizeSlots(this.$slots, this.$vnode.context) || [];
        const injectSlot = slots.find((item) => item.data.slot === 'inject');
        if (!injectSlot) {
            slots.push(h('template', {
                slot: 'inject',
            }, [ctrlSlot]));
        } else {
            console.error('搭建平台不允许使用此 slot');
        }
        return h('div', {
            style: {
                display: 'none!important',
            },
        }, [
            h('u-modal-source', {
                class: this.class,
                style: this.style,
                attrs: this.$attrs,
                props: this.$props,
                on: this.$listeners,
                scopedSlots: this.$scopedSlots,
                ref: 'modal',
            }, slots),
        ]);
    },
});
