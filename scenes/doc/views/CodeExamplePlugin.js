export default {
    install(Vue) {
        Vue.mixin({
            data() {
                return {
                    codeExampleDemoVM: undefined,
                };
            },
            created() {
                this.$contact('u-code-example-demo', (codeExampleDemoVM) => {
                    this.codeExampleDemoVM = codeExampleDemoVM;
                    if (this.$options._componentTag && this.$options._componentTag.startsWith('anondemo-'))
                        codeExampleDemoVM.anondemoVM = this;
                });
                this.codeExampleDemoVM && this.codeExampleDemoVM.debouncedFlush();
            },
            updated() {
                this.codeExampleDemoVM && this.codeExampleDemoVM.debouncedFlush();
            },
            methods: {
                $contact(condition, callback) {
                    if (typeof condition === 'string') {
                        const name = condition;
                        condition = ($parent) => $parent.$options.name === name;
                    }

                    let $parent = this.$parent || this.$root;
                    while ($parent && !condition($parent))
                        $parent = $parent.$parent;

                    $parent && callback($parent);
                },
            },
        });

        const logEvent = function (eventName, payload) {
            if (!this.$vnode)
                return;
            const context = this.$vnode.context;
            if (this.codeExampleDemoVM && !eventName.startsWith('hook:')
                && (context === this.codeExampleDemoVM.$parent.$vnode.context
                    || (context.$options._componentTag && context.$options._componentTag.startsWith('anondemo-')))) {
                this.codeExampleDemoVM.logEvent(this, eventName, payload);
                setTimeout(() => this.codeExampleDemoVM && this.codeExampleDemoVM.debouncedFlush());
            }
        };

        const oldEmit = Vue.prototype.$emit;
        Vue.prototype.$emit = function (...args) {
            logEvent.call(this, args[0], args.slice(1));
            return oldEmit.apply(this, args);
        };
    },
};
