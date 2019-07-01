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
            myConfig: {
                js: ['vusion.config.js'],
            },
        },

        // other config properties
        onRead: ({ data }) => {
            console.log(data);
            return {
                prompts: [
                    {
                        name: `color`,
                        type: 'input',
                        message: 'Define the color for greeting message',
                        value: 'white',
                    },
                ],
            };
        },

        onWrite: ({ prompts, api }) => {
            // ...
        },
    });
};
