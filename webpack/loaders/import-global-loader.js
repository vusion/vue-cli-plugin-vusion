const fs = require('fs');
const path = require('path');
const loaderUtils = require('loader-utils');

module.exports = function (content) {
    const outputs = [content];
    const config = loaderUtils.getOptions(this);

    const theme = this.theme || (config.themes ? config.themes[0] : 'default');
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

    return outputs.join('\n');
};
