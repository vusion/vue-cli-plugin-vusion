import { MEmitter } from 'cloud-ui';
import saferEval from 'safer-eval';

const rawTypeRE = /^\[object (\w+)]$/;
const specialTypeRE = /^\[native \w+ (.*)\]$/;

const isPlainObject = (obj) => Object.prototype.toString.call(obj) === '[object Object]';
// const isPrimitive = (data) => {
//     if (data === null || data === undefined)
//         return true;
//     const type = typeof data;
//     return type === 'string' || type === 'number' || type === 'boolean';
// };

export default {
    name: 'u-data-view-node',
    rootName: 'u-data-view',
    mixins: [MEmitter],
    props: {
        property: String,
        value: null,
        expanded: { type: Boolean, default: false },
        readonly: { type: Boolean, default: false },
        disabled: { type: Boolean, default: false },
    },
    data() {
        return {
            depth: 0,
            currentExpanded: this.expanded,
            editing: false,
            currentValue: this.value,
            editingValue: '',
            nodeVMs: [],
            parentVM: undefined,
            rootVM: undefined,
            textareaStyle: {},
        };
    },
    computed: {
        valueType() {
            const type = typeof this.currentValue;

            if (this.currentValue === null || this.currentValue === undefined)
                return 'null';
            else if (
                type === 'boolean'
                || type === 'number'
                || this.currentValue === Infinity
            )
                return 'literal';
            else if (specialTypeRE.test(this.currentValue))
                return 'native';
            else if (type === 'string' && !rawTypeRE.test(this.currentValue))
                return 'string';
        },
        formattedValue() {
            const type = typeof this.currentValue;

            if (this.currentValue === null)
                return 'null';
            else if (this.currentValue === undefined)
                return 'undefined';
            else if (type === 'number' && isNaN(this.currentValue))
                return 'NaN';
            else if (this.currentValue === Infinity)
                return 'Infinity';
            else if (Array.isArray(this.currentValue))
                return 'Array[' + this.currentValue.length + ']';
            else if (isPlainObject(this.currentValue))
                return 'Object' + (Object.keys(this.currentValue).length ? '' : ' (empty)');
            else if (this.currentValueType === 'native')
                return specialTypeRE.exec(this.currentValue)[1];
            else if (type === 'string') {
                const typeMatch = this.currentValue.match(rawTypeRE);
                if (typeMatch)
                    return typeMatch[1];
                else
                    return JSON.stringify(this.currentValue);
            } else if (type === 'function')
                return 'Function';
            else
                return this.currentValue;
        },
        keys() {
            if (Array.isArray(this.currentValue) || isPlainObject(this.currentValue))
                return Object.keys(this.currentValue);
        },
        // textareaStyle() {
        //     const rows = this.editingValue.split('\n');
        //     const maxLength = Math.max(...rows.map((row) => row.length));

        //     return {
        //         width: maxLength * 7 + 'px',
        //         height: rows.length * 13 + 'px',
        //     };
        // },
    },
    watch: {
        expanded(expanded) {
            this.currentExpanded = expanded;
        },
        value(value) {
            this.currentValue = value;
        },
    },
    created() {
        this.dispatch(this.$options.name, 'add-node-vm', this);
        !this.parentVM && this.dispatch(this.$options.rootName, 'add-node-vm', this);

        this.$on('add-node-vm', (nodeVM) => {
            nodeVM.rootVM = this.rootVM;
            nodeVM.parentVM = this;
            nodeVM.depth = this.depth + 1;
            if (nodeVM.depth <= nodeVM.rootVM.expandDepth)
                nodeVM.currentExpanded = true;
            this.nodeVMs.push(nodeVM);
        });
        this.$on('remove-node-vm', (nodeVM) => {
            nodeVM.rootVM = undefined;
            nodeVM.parentVM = undefined;
            this.nodeVMs.splice(this.nodeVMs.indexOf(nodeVM), 1);
        });
    },
    destroyed() {
        this.dispatch(this.$options.rootName, 'remove-node-vm', this);
        this.dispatch(this.$options.name, 'remove-node-vm', this);
    },
    methods: {
        toggle(expanded) {
            // if (this.disabled || this.rootVM.readonly || this.rootVM.disabled)
            //     return;

            const oldExpanded = this.currentExpanded;

            if (expanded === undefined)
                expanded = !this.currentExpanded;

            if (expanded === oldExpanded)
                return;

            let cancel = false;
            this.$emit('before-toggle', {
                expanded,
                // node: this.node,
                nodeVM: this,
                preventDefault: () => cancel = true,
            });
            if (cancel)
                return;

            this.currentExpanded = expanded;

            this.$emit('update:expanded', expanded);
            this.$emit('toggle', {
                expanded,
                // node: this.node,
                nodeVM: this,
            });

            // this.rootVM.toggle(this, expanded);
        },
        edit() {
            if (this.readonly || this.disabled)
                return;

            this.editing = true;

            // isPrimitive(this.currentValue) ? this.currentValue :
            this.editingValue = JSON.stringify(this.currentValue, (key, value) => {
                if (value === undefined)
                    return '__vusion__undefined__';
                else if (typeof value === 'number' && isNaN(value))
                    return '__vusion__NaN__';
                else if (value === Infinity)
                    return '__vusion__Infinity__';
                return value;
            })
                .replace(/"__vusion__undefined__"/g, 'undefined')
                .replace(/"__vusion__NaN__"/g, 'NaN')
                .replace(/"__vusion__Infinity__"/g, 'Infinity');

            this.$nextTick(() => {
                this.resizeTextarea(this.$refs.textarea);
                this.$refs.textarea.select();
            });
        },
        change() {
            this.editing = false;
            try {
                const newValue = saferEval(this.editingValue);
                this.$emit('input', newValue);

                const $event = {
                    property: this.property,
                    oldValue: this.currentValue,
                    newValue,
                    nodeVM: this,
                };
                this.$emit('change', $event);
                this.rootVM.change($event);
            } catch (e) {}
        },
        resizeTextarea(textareaEl) {
            textareaEl.style.width = '3px';
            textareaEl.style.height = '3px';
            textareaEl.style.width = textareaEl.scrollWidth - 3 + 'px';
            textareaEl.style.height = textareaEl.scrollHeight + 'px';
        },
    },
};
