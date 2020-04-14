const postcss = require('postcss');
// const parse = require('postcss-values-parser').parse;

function isBlockIgnored(ruleOrDeclaration) {
    const rule = ruleOrDeclaration.selector
        ? ruleOrDeclaration : ruleOrDeclaration.parent;

    return /(!\s*)?postcss-custom-properties:\s*off\b/i.test(rule.toString());
}

// return custom selectors from the css root, conditionally removing them
function getCustomPropertiesFromRoot(root, opts) {
    // initialize custom selectors
    const customPropertiesFromHtmlElement = {};
    const customPropertiesFromRootPseudo = {};

    // for each html or :root rule
    root.nodes.slice().forEach((rule) => {
        const customPropertiesObject = isHtmlRule(rule)
            ? customPropertiesFromHtmlElement
            : isRootRule(rule)
                ? customPropertiesFromRootPseudo
                : null;

        // for each custom property
        if (customPropertiesObject) {
            rule.nodes.slice().forEach((decl) => {
                if (isCustomDecl(decl) && !isBlockIgnored(decl)) {
                    const { prop } = decl;

                    // write the parsed value to the custom property
                    customPropertiesObject[prop] = decl.value;
                }
            });
        }
    });

    // return all custom properties, preferring :root properties over html properties
    return { ...customPropertiesFromHtmlElement, ...customPropertiesFromRootPseudo };
}

// match html and :root rules
const htmlSelectorRegExp = /^html$/i;
const rootSelectorRegExp = /^:root$/i;
const customPropertyRegExp = /^--[A-z][\w-]*$/;

// whether the node is an html or :root rule
const isHtmlRule = (node) => node.type === 'rule' && node.selector.split(',').some((item) => htmlSelectorRegExp.test(item)) && Object(node.nodes).length;
const isRootRule = (node) => node.type === 'rule' && node.selector.split(',').some((item) => rootSelectorRegExp.test(item)) && Object(node.nodes).length;

// whether the node is an custom property
const isCustomDecl = (node) => node.type === 'decl' && customPropertyRegExp.test(node.prop);

// whether the node is a parent without children
const isEmptyParent = (node) => Object(node.nodes).length === 0;

module.exports = postcss.plugin('postcss-custom-properties-reader', (opts) => (root) => {
    const customProperties = getCustomPropertiesFromRoot(root);
    root.cssProperties = customProperties;
});
