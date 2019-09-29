const postcss = require('postcss');
module.exports = postcss.plugin('add-class-plugin', ({ loaderContext, classList }) => (styles, result) => {
    const classCheckList = classList.map((name) => `.${name}`);
    return Promise.resolve().then(() => {
        styles.walkRules((rule) => {
            if (classCheckList.includes(rule.selector))
                rule.selector = rule.selector + '[class]';
        });
    });
});
