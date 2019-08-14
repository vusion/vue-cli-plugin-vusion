const chainDoc = require('./chainDoc');

module.exports = function registerDocBuild(api, vueConfig, vusionConfig) {
    const buildCommand = api.service.commands.build;

    api.registerCommand('doc-build', {
        description: 'Run documents server',
        usage: 'vue-cli-service doc-build',
        options: buildCommand.opts.options,
    }, (args) => {
        chainDoc(api, vueConfig, vusionConfig);
        return buildCommand.fn(args);
    });
};
