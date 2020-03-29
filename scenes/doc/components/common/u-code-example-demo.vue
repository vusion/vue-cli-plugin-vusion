<template>
<div><slot></slot></div>
</template>
<script>
import debounce from 'lodash/debounce';

export default {
    name: 'u-code-example-demo',
    data() {
        return {
            anondemoVM: undefined,
        };
    },
    created() {
        this.debouncedFlush = debounce(this.flush, 100, {
            leading: true,
            trailing: true,
        });
    },
    methods: {
        flush() {
            if (!this.anondemoVM)
                return;
            const $data = this.anondemoVM.$data;
            const data = {};

            Object.keys($data).forEach((key) => {
                if (key !== 'codeExampleDemoVM')
                    data[key] = $data[key];
            });
            this.$parent.anondemoData = data;
        },
        logEvent(...args) {
            this.$parent.logEvent(...args);
        },
    },
};
</script>
