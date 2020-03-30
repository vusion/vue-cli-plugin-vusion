const cs = require('@vue/cli-test-utils/createServer');

module.exports = async function createServer(options) {
    server = cs(options);

    await new Promise((res, rej) => {
        server.listen(options.port, (err) => err ? rej(err) : res());
    });

    return server;
}
