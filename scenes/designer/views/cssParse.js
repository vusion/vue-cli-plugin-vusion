const postcss = require('postcss');

const getClassName = function getClassName(styleStr) {
    if (/^\$style\[['"](.*)['"]\]$/g.test(styleStr)) {
        const classNameVarName = /^\$style\[['"](.*)['"]\]$/g.exec(styleStr);
        if (classNameVarName)
            return classNameVarName[1];
    } else if (/^\$style./g.test(styleStr)) {
        const classNameVarName = styleStr.split('.')[1];
        if (classNameVarName)
            return classNameVarName;
    }
    return undefined;
};

const getBindingClasses = function getBindingClasses(content) {
    const classSet = new Set();
    const pushClass = (styleStr) => {
        const className = getClassName(styleStr);
        if (className)
            classSet.add(className);
    };
    content.replace(/<([^>\s]+)?\s.*:class="([^"]+)"/g, (m, $1, $2) => {
        if ($1 !== '!--') {
            const className = $2;
            if (/^\[.*\]$/g.test(className)) {
                const result = /^\[(.*)\]$/g.exec(className);
                const contents = result[1].split(',').filter((item) => item).map((item) => item.trim());
                for (const item of contents) {
                    pushClass(item);
                }
            } else
                pushClass(className);
        }
        return m;
    });
    return Array.from(classSet);
};

exports.postcssParse = function postcssParse(content, suffix, template) {
    const classSet = getBindingClasses(template);
    const classListStr = classSet.join('|');
    const root = postcss.parse(content);
    root.walkRules((rule) => {
        rule.selector = rule.selector.replace(new RegExp(`\\.(${classListStr})(?![-_a-zA-Z0-9]|\\[class\\])`, 'g'), (n) => n + '_' + suffix);
    });
    return root.toResult().css;
};
