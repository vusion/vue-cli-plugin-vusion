const fs = require('fs');
const path = require('path');
const postcss = require('postcss');
const addClassPlugin = require('../postcss/add-class-plugin.js');
const loaderUtils = require('loader-utils');
const getCssList = require('./get-css-handle-list.js');

module.exports = function (content, meta) {
    this.cacheable();
    const callback = this.async();
    const outputs = [content];
    const config = loaderUtils.getOptions(this);

    const theme = this.theme || 'default';
    const globalCSSPathMap = typeof config.globalCSSPath === 'string' ? {
        default: config.globalCSSPath,
    } : config.globalCSSPath;
    const globalCSSPath = globalCSSPathMap[theme];

    // Import global.css
    const globalPath = path.resolve(process.cwd(), globalCSSPath);
    let relativePath = path.relative(path.dirname(this.resourcePath), globalPath);
    if (!path.isAbsolute(relativePath))
        relativePath = './' + relativePath;
    this.addDependency(globalPath);
    if (fs.existsSync(globalPath))
        outputs.unshift(`@import '${relativePath}';`);

    // Import theme css
    if (this.theme) {
        const srcIndex = this.resourcePath.lastIndexOf('/src/');
        if (~srcIndex) {
            const themePath = this.resourcePath.slice(0, srcIndex) + `/theme-${this.theme}/` + this.resourcePath.slice(srcIndex + 5);
            if (fs.existsSync(themePath)) {
                this.addDependency(themePath);
                outputs.push(`@import '${themePath}';`);
            }
        }
    }
    getCssList(this.context).then((content) => {
        if (content && content.length !== 0) {
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
            const pluginList = [addClassPlugin].map((plugin) => plugin({ loaderContext: this, classList: content }));
            postcss(pluginList).process(outputs.join('\n'), options).then((result) => {
                const map = result.map && result.map.toJSON();
                callback(null, result.css, map);
            }).catch((error) => {
                callback(error);
            });
        } else
            callback(null, outputs.join('\n'), meta);
    });
    
};
