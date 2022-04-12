const postcss = require('postcss');
const { replaceSelector } = require('./utils');
const path = require('path');
module.exports = postcss.plugin('fix-priority-plugin', ({ loaderContext, classList }) => (styles, result) => Promise.resolve().then(() => {
    // - 组件库加 :not(html)
    // - 业务中加 [class]
    const compPath = path.join('src', 'components');
    const globalCompPath = path.join('src', 'global', 'components');
    const suffix = loaderContext.context && (loaderContext.context.includes(compPath) || loaderContext.context.includes(globalCompPath)) ? ':not(html)' : '[class]';
    styles.walkRules((rule) => {
        rule.selector = replaceSelector(rule.selector, classList, suffix);
    });
}));
