module.exports = function rawCSS(config, vueConfig, vusionConfig) {
    function rawOneOf(oneOf) {
        oneOf.uses.delete('css-sprite-loader')
            .delete('svg-classic-sprite-loader')
            .delete('icon-font-loader');
    }

    const ruleCSS = config.module.rule('css');
    rawOneOf(ruleCSS.oneOf('vue-modules'), true);
    rawOneOf(ruleCSS.oneOf('vue'), false);
    rawOneOf(ruleCSS.oneOf('normal-modules'), true);
    rawOneOf(ruleCSS.oneOf('normal'), false);

    config.plugins.delete('icon-font-plugin');
    config.plugins.delete('css-sprite-plugin');
};
