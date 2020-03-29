import DataViewNode from '../u-data-view-node.vue';

export default {
    name: 'u-data-view',
    childName: 'u-data-view-node',
    mixins: [DataViewNode],
    props: {
        expandDepth: { type: Number, default: 0 },
    },
    created() {
        this.rootVM = this;
        this.$on('add-node-vm', (nodeVM) => {
            nodeVM.rootVM = this;
            this.nodeVMs.push(nodeVM);
        });
        this.$on('remove-node-vm', (nodeVM) => {
            nodeVM.rootVM = undefined;
            this.nodeVMs.splice(this.nodeVMs.indexOf(nodeVM), 1);
        });
    },
    methods: {
        change($event) {
            this.$emit('change', $event);
        },
    },
};
