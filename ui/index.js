const resolver = require('../src/config/resolveConfig');
module.exports = (api) => {
    api.describeConfig({
        // Unique ID for the config
        id: 'org.vusion.config',
        // Displayed name
        name: 'Vusion Configration',
        // Shown below the name
        description: 'This config defines the Vusion configs',
        // "More info" link
        link: 'https://github.com/ktsn/vue-cli-plugin-auto-routing#readme',

        icon: 'color_lens',

        files: {
            vusionConfig: {
                js: ['vusion.config.js'],
            },
        },

        // other config properties
        onRead: ({ data }) => {
            const config = resolver(data.vusionConfig);
            data.rawVusionConfig = config;
            return {
                prompts: Object.keys(config).map((k) => {
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
                }),
            };

            // {
            //     prompts: [
            //         {
            //             name: `type`,
            //             type: 'list',
            //             message: `[Required] Vusion project type. 'library', 'app'`,
            //             value: config.type,
            //             choices: ['library', 'app', 'html5', 'fullstack'].map((i) => ({ name: i, value: i })),
            //         },
            //         {
            //             name: `staticPath`,
            //             type: 'input',
            //             message: 'project type',
            //             value: config.type,
            //         },

            //     ],
            // };
        },

        async onWrite({ data, prompts, api }) {
            // ...
            const rawData = data.vusionConfig;
            const raw = data.rawVusionConfig;
            const result = {};
            await Promise.all(prompts.map((prompt) => {
                const id = prompt.id;
                return api.getAnswer(id).then((r) => {
                    // console.log(`${id} -> rawData.hasOwnProperty(id) ${rawData.hasOwnProperty(id)} || compare(raw[id], r) ${compare(raw[id], r)} ${raw[id]} ${r}`);
                    if (rawData.hasOwnProperty(id)
                        || (compare(raw[id], r) && !rawData.hasOwnProperty(id))) {
                        result[`${id}`] = r;
                        // console.log('->   ' + id);
                    }
                });
            }));
            api.setData('vusionConfig', result);
        },
    });
};

function compare(a, b) {
    if (typeof b === 'string' && typeof a !== 'string')
        return JSON.stringify(a) !== b;

    return a !== b;
}
