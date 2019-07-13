const tcpPortUsed = require('tcp-port-used');
const internalIp = require('internal-ip');

export const checkPort = (port, host) =>
    tcpPortUsed.check(port, host)
        .then((used) => (used) ? checkPort(port + 1, host) : port);

export const createDomain = (options) => {
    const protocol = options.https ? 'https' : 'http';
    const port = options.port;
    const hostname = options.useLocalIp ? internalIp.v4() : options.host;

    // the formatted domain (url without path) of the webpack server
    return options.public ? `${protocol}://${options.public}` : `${protocol}://${hostname}:${port}`;
};
