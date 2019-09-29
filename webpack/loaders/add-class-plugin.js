const postcss = require('postcss');
module.exports = postcss.plugin('add-class-plugin', ({ loaderContext, classList }) => (styles, result) => {
    return Promise.resolve().then(() => {
        const afterFixed = loaderContext.context && loaderContext.context.search('components') ? ':not(html)' : '[class]' ;
        styles.walkRules((rule) => {
            const regx = new RegExp(`.([a-zA-Z0-9]*)(?![-_a-zA-Z0-9])`, 'g');
            const reuslt = regx.exec(rule.selector);
            if (reuslt && classList.includes(reuslt[1])) {
                const name = reuslt[1];
                rule.selector = rule.selector.replace(new RegExp(`.${name}(?![-_a-zA-Z0-9])`, 'g'), (n) => {
                    return n + afterFixed;
                });
                console.log(rule.selector);
            }
        });
    });
});
 