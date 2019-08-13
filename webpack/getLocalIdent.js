const loaderUtils = require('loader-utils');
const path = require('path');

module.exports = function (loaderContext, localIdentName, localName, options) {
    if (!options.context)
        options.context = loaderContext.rootContext;
    const resourcePath = loaderContext.resourcePath;
    const request = path.relative(options.context, resourcePath.replace(/\.vue[\\/].*$/, ''));
    options.content = options.hashPrefix + request;

    if (!localIdentName.includes('[local]'))
        options.content += '+' + localName;
    // @TODO: This is a temp solution because a function cannot be transfered through a loader string.
    if (/\.vue[\\/]module\.css$/.test(resourcePath)) {
        const tmpPath = resourcePath.replace(/\.vue[\\/]/g, '_').replace(/_module\.css$/, '');
        const vueName = path.basename(tmpPath);
        localIdentName = localIdentName.replace(/\[name\]/gi, vueName);
    }

    if (localName === 'root')
        localIdentName = localIdentName.replace(/_\[local\]/gi, '');
    else
        localIdentName = localIdentName.replace(/\[local\]/gi, localName);

    const hash = loaderUtils.interpolateName(loaderContext, localIdentName, options);
    return hash.replace(new RegExp('[^a-zA-Z0-9\\-_\u00A0-\uFFFF]', 'g'), '-').replace(/^((-?[0-9])|--)/, '_$1');
};
