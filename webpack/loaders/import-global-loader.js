const fs = require('fs');
const path = require('path');
const loaderUtils = require('loader-utils');

module.exports = function (content) {
    const outputs = [content];
    const config = loaderUtils.getOptions(this);

    const theme = this.theme || (config.theme.default ? 'default' : Object.keys(config.theme)[0]);
    const themeCSSPath = path.resolve(process.cwd(), config.theme[theme]);
    let relativePath = path.relative(path.dirname(this.resourcePath), themeCSSPath);
    if (!path.isAbsolute(relativePath))
        relativePath = './' + relativePath;
    this.addDependency(themeCSSPath);
    if (fs.existsSync(themeCSSPath))
        outputs.unshift(`@import '${relativePath}';`);

    return outputs.join('\n');
};
