const chainDoc = require('./chainDoc');

module.exports = function registerDoc(api, vueConfig, vusionConfig) {
    const serveCommand = api.service.commands.serve;

    api.registerCommand('doc', {
        description: 'Run documents server',
        usage: 'vue-cli-service doc',
        options: serveCommand.opts.options,
    }, (args) => {
        chainDoc(api, vueConfig, vusionConfig);
        return serveCommand.fn(args);
    });
};
