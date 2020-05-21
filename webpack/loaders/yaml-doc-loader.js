const path = require('path');
const loaderUtils = require('loader-utils');
const vusion = require('vusion-api');

module.exports = function (yaml, map, meta) {
    const params = this.resourceQuery ? loaderUtils.parseQuery(this.resourceQuery) : {};
    if (params['yaml-doc'] !== 'api' && params['yaml-doc'] !== 'all') {
        this.addContextDependency(path.join(this.resourcePath, '../docs'));
        this.addDependency(path.join(this.resourcePath, '../docs/index.md'));
    }

    const callback = this.async();
    const apiHandler = new vusion.fs.APIHandler(yaml, this.resourcePath);

    /* eslint-disable require-await */
    const markdown = async () => {
        if (params['yaml-doc'] === 'api')
            return apiHandler.markdownAPI();
        else if (params['yaml-doc'] === 'all')
            return apiHandler.markdown();
        else
            return apiHandler.markdownIndex();
    };

    markdown()
        .then((result) => callback(null, result, map, meta))
        .catch((e) => callback(e));
};
