const postcss = require('postcss');

// match html and :root rules
const htmlSelectorRegExp = /^html$/i;
const rootSelectorRegExp = /^:root$/i;
const customPropertyRegExp = /^--[A-z][\w-]*$/;

// whether the node is an html or :root rule
const isHtmlRule = (node) => node.type === 'rule' && node.selector.split(',').some((item) => htmlSelectorRegExp.test(item)) && Object(node.nodes).length;
const isRootRule = (node) => node.type === 'rule' && node.selector.split(',').some((item) => rootSelectorRegExp.test(item)) && Object(node.nodes).length;

// whether the node is an custom property
const isCustomDecl = (node) => node.type === 'decl' && customPropertyRegExp.test(node.prop);

module.exports = postcss.plugin('postcss-custom-properties-computed', (opts) => (root) => {
    const customPropertiesObject = {};
    root.nodes.slice().forEach((rule) => {
        const cp = (isHtmlRule(rule) || isRootRule(rule)) ? {} : null;

        // for each custom property
        if (customPropertiesObject) {
            rule.nodes && rule.nodes.slice().forEach((decl) => {
                if (isCustomDecl(decl)) {
                    const { prop } = decl;
                    
                    // write the parsed value to the custom property
                    customPropertiesObject[prop] = decl.value;
                }
            });
        }
        Object.assign(customPropertiesObject, cp);
    });
    root.cssProperties = customPropertiesObject;
});