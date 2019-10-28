const postcss = require('postcss');
const fixPriorityPlugin = require('./fix-priority-plugin');
const { getBindingClasses } = require('./getBindingClasses');

module.exports = function (content, meta) {
    const callback = this.async();

    // Handle CSS Modules priority
    getBindingClasses(this.context).then((classList) => {
        if (classList && classList.length) {
            const options = {
                to: this.resourcePath,
                from: this.resourcePath,
            };
            if (meta && meta.sourceRoot && meta.mappings) {
                options.map = {
                    prev: meta,
                    inline: false,
                    annotation: false,
                };
            }
            const plugins = [fixPriorityPlugin].map((plugin) => plugin({ loaderContext: this, classList }));
            postcss(plugins).process(content, options).then((result) => {
                const map = result.map && result.map.toJSON();
                callback(null, result.css, map);
            }).catch((error) => {
                callback(error);
            });
        } else
            callback(null, content, meta);
    });
};
