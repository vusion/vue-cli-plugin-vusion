const parse = require('postcss-values-parser').parse;
const transformValueAST = require('./transform-value-ast');

// transform custom pseudo selectors with custom selectors
module.exports = (root, customProperties) => {
	// walk decls that can be transformed
	// const customComputedProperties = Object.assign({}, customProperties);
	root.walkDecls(decl => {
		if (isTransformableDecl(decl)) {
			const originalValue = decl.value;
			const prop = decl.prop;
			const valueAST = parse(originalValue);
			const valueASTRoot = transformValueAST(valueAST, customProperties);
			const value = String(valueASTRoot);
			// customComputedProperties[prop] = valueASTRoot;
			// conditionally transform values that have changed
			if (value !== originalValue) {
                decl.value = value;
			}
		}
	});
};

// match custom property inclusions
const customPropertiesRegExp = /(^|[^\w-])var\([\W\w]+\)/;

// whether the declaration should be potentially transformed
const isTransformableDecl = decl => customPropertiesRegExp.test(decl.value);
