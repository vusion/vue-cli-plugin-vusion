const postcss = require('postcss');
module.exports = postcss.plugin('fix-priority-plugin', ({ loaderContext, classList }) => (styles, result) => Promise.resolve().then(() => {
    // - 组件库加 :not(html)
    // - 业务中加 [class]
    const suffix = loaderContext.context && loaderContext.context.includes('src/components') ? ':not(html)' : '[class]';
    styles.walkRules((rule) => {
        const re = new RegExp(`.([a-zA-Z0-9]*)(?![-_a-zA-Z0-9])`, 'g');
        // @TODO multi selector
        const result = re.exec(rule.selector);

        if (result && classList.includes(result[1])) {
            const name = result[1];
            rule.selector = rule.selector.replace(new RegExp(`.${name}(?![-_a-zA-Z0-9])`, 'g'), (n) => n + suffix);
        }
    });
}));
