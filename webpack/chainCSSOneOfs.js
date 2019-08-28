module.exports = function chainCSSOneOfs(config, chainOneOf) {
    const ruleCSS = config.module.rule('css');
    chainOneOf(ruleCSS.oneOf('vue-modules'), true);
    chainOneOf(ruleCSS.oneOf('vue'), false);
    chainOneOf(ruleCSS.oneOf('normal-modules'), true);
    chainOneOf(ruleCSS.oneOf('normal'), false);
};
