module.exports = function chainWebworker(api) {
    api.chainWebpack((config) => {
        config.module.rule('worker')
            .test(/\.worker\.js$/)
            .use('worker')
            .loader('worker-loader')
            .options({inline: 'no-fallback', esModule: true});
        config.module.rule('js').uses.delete('thread-loader');
    });
};
