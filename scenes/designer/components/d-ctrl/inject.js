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
    },
    render(h) {
        const ctrlSlot = h('d-ctrl', {
            on: {
                click: this.closeHandler,
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
