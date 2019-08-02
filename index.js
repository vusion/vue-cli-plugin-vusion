module.exports = function (api, options) {
    const adapter = (factory, vusionConfig, webpackConfigInVusionConfig) => {
        api.chainWebpack((chain) => {
            factory(chain);
        }); // vusion webpack config inject function
        // 直接合入 vusionConfig.webpack
        api.configureWebpack(() =>
            webpackConfigInVusionConfig);
    };
    require('vusion-cli-core').default(adapter);
};
