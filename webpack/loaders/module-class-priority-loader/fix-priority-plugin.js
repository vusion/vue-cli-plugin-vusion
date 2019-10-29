const postcss = require('postcss');
const { replaceSelector } = require('./utils');
module.exports = postcss.plugin('fix-priority-plugin', ({ loaderContext, classList }) => (styles, result) => Promise.resolve().then(() => {
    // - 组件库加 :not(html)
    // - 业务中加 [class]
    const suffix = loaderContext.context && loaderContext.context.includes('src/components') ? ':not(html)' : '[class]';
    styles.walkRules((rule) => {
        rule.selector = replaceSelector(rule.selector, classList, suffix);
    });
}));
