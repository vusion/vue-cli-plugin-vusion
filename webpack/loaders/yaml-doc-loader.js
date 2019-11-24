const path = require('path');
const loaderUtils = require('loader-utils');
const vusion = require('vusion-api');

module.exports = function (yaml, map, meta) {
    const callback = this.async();
    const params = this.resourceQuery ? loaderUtils.parseQuery(this.resourceQuery) : {};

    const apiHandler = new vusion.fs.APIHandler(yaml, this.resourcePath);

    /* eslint-disable require-await */
    const markdown = async () => {
        if (params['yaml-doc'] === 'api')
            return apiHandler.markdownAPI();
        else if (params['yaml-doc'] === 'all')
            return apiHandler.markdown();
        else {
            this.addDependency(path.join(this.resourcePath, '../docs/index.md'));
            return apiHandler.markdownIndex();
        }
    };

    markdown()
        .then((result) => callback(null, result, map, meta))
        .catch((e) => callback(e));
};
