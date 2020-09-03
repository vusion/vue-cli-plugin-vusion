const postcss = require('postcss');

exports.postcssParse = function postcssParse(content, prefix) {
    const root = postcss.parse(content);
    root.walkRules((rule) => {
        rule.selector = `.${prefix}${rule.selector.replace('.', '')}`;
    });
    return root.toResult().css;
};
