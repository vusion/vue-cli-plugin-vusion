const resolver = require('../src/config/resolveConfig');
const data
    = { type: 'app',
        extractCSS: true,
        libraryPath:
       '/Users/wangtao/Documents/Playground/hello-world/node_modules/proto-ui.vusion/src',
        webpack: { entry: [Object], output: [Object] },
        webpackDevServer:
       { contentBase: '/Users/wangtao/Documents/Playground/hello-world' } };
const config = resolver(data);
console.log(config);

console.log(config);
console.log({ prompts: Object.keys(config).map((k) => {
    const t = typeof config[k];
    const pattern = {
        name: k,
        value: config[k],
        message: k,
    };
    switch (t) {
        case 'string':
        case 'undefined':
        default:
            return {
                type: 'input',
                ...pattern,
            };
        case 'boolean':
            return {
                type: 'confirm',
                ...pattern,
            };
        case 'object':
            return {
                type: 'input',
                ...pattern,
                value: JSON.stringify(config[k]),
            };
    }
}) });
