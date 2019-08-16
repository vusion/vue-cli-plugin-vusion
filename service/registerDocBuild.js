const chainDoc = require('./chainDoc');

module.exports = function registerDocBuild(api, vueConfig, vusionConfig) {
    const buildCommand = api.service.commands.build;

    api.registerCommand('doc-build', {
        description: 'Build documentation',
        usage: 'vue-cli-service doc-build',
        options: buildCommand.opts.options,
    }, (args) => {
        chainDoc(api, vueConfig, vusionConfig);
        return buildCommand.fn(args);
    });
};
