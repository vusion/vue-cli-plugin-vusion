const tcpPortUsed = require('tcp-port-used');
const internalIp = require('internal-ip');

const checkPort = (port, host) =>
    tcpPortUsed.check(port, host)
        .then((used) => (used) ? checkPort(port + 1, host) : port);

const createDomain = (options) => {
    const protocol = options.https ? 'https' : 'http';
    const port = options.port;
    const hostname = options.useLocalIp ? internalIp.v4() : options.host;

    // the formatted domain (url without path) of the webpack server
    return options.public ? `${protocol}://${options.public}` : `${protocol}://${hostname}:${port}`;
};
const addDevServerEntryPoints = (webpackConfig, devOptions, domain) => {
    const devClient = [require.resolve('webpack-hot-middleware/client') + '?reload=true'];

    if (domain) {
        devClient[0] = `${require.resolve('webpack-dev-server/client')}?${domain}`;
        if (devOptions.hotOnly)
            devClient.push('webpack/hot/only-dev-server');
        else if (devOptions.hot)
            devClient.push('webpack/hot/dev-server');
    }

    [].concat(webpackConfig).forEach((wpOpt) => {
        if (typeof wpOpt.entry === 'object' && !Array.isArray(wpOpt.entry)) {
            Object.keys(wpOpt.entry).forEach((key) => {
                wpOpt.entry[key] = devClient.concat(wpOpt.entry[key]);
            });
        } else if (typeof wpOpt.entry === 'function')
            wpOpt.entry = wpOpt.entry(devClient);
        else
            wpOpt.entry = devClient.concat(wpOpt.entry);
    });
};
const smartMerge = function (target, source) {
    if (source === undefined || source === null)
        return target;

    let result;

    if (target instanceof Array ^ source instanceof Array)
        throw new Error('Type of target and source are not same!');
    else if (target instanceof Array && source instanceof Array) {
        // Copy source, not to change it directly.
        source = Array.from(source);
        // @deprecated
        const index = source.indexOf('EXTENDS');
        if (~index) {
            console.warn(`[WARNING] 'EXTENDS' option in vusion config is deprecated. We will not support in the future. Please remove it soon.`);
            source.splice(index, 1);
        }
        source.push(...target);
        result = source;
    } else if (target instanceof Object && source instanceof Object) {
        result = target;
        for (const key in source) {
            if (source.hasOwnProperty(key)) {
                if (source[key] instanceof Array)
                    target[key] = smartMerge(target[key] || [], source[key]);
                else if (source[key] instanceof Object) {
                    // @deprecated
                    if (source[key].EXTENDS) {
                        console.warn(`[WARNING] 'EXTENDS' option in vusion config is deprecated. We will not support in the future. Please remove it soon.`);
                        delete source[key].EXTENDS;
                    }
                    target[key] = smartMerge(target[key] || {}, source[key]);
                } else
                    target[key] = source[key];
            }
        }
    } else
        throw new Error('Type of target and source are not supported to merge!');

    return result;
};

const merge = function (target, ...sources) {
    sources.forEach((source) => target = smartMerge(target, source));
    return target;
};

module.exports = {
    checkPort,
    createDomain,
    addDevServerEntryPoints,
    merge,
};
