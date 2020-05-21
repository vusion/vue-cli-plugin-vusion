const parse = require('postcss-values-parser').parse;

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
                if (isCustomDecl(decl)) {
                    const { prop } = decl;
                    
                    // write the parsed value to the custom property
                    customPropertiesObject[prop] = parse(decl.value).nodes;
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

module.exports = getCustomPropertiesFromRoot;
