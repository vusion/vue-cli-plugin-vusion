module.exports = (api) => {
    api.describeConfig({
        // Unique ID for the config
        id: 'org.vusion',
        // Displayed name
        name: 'Vusion',
        // Shown below the name
        description: 'Vusion 配置',
        // "More info" link
        link: 'https://github.com/vusion/vue-cli-plugin-vusion',
        icon: 'settings',
        files: {
            // vue: {
            //     js: ['vue.config.js'],
            // },
            vusion: {
                js: ['vusion.config.js'],
            },
        },

        // other config properties
        onRead: ({ data, cwd }) => ({
            prompts: [{
                name: 'outputPath',
                message: '输出目录',
                type: 'input',
                default: 'public',
                value: data.vusion.outputPath,
                description: '构建产生的文件将会生成在这里。该参数会覆盖 Vue CLI 的配置。',
                group: '基础设置',
            }, {
                name: 'publicPath',
                message: '公共路径',
                type: 'input',
                default: '',
                value: data.vusion.publicPath,
                description: `应用的部署地址。如'/my-app/'。默认留空，所有资源会使用相对路径。`,
                group: '基础设置',
            }, {
                name: 'staticPath',
                message: '静态资源目录',
                type: 'input',
                default: '',
                value: data.vusion.staticPath,
                description: `构建时，会将该目录中的资源全部原样拷贝到输出目录下。`,
                group: '基础设置',
            }, {
                name: 'srcPath',
                message: '源文件目录',
                type: 'input',
                default: './src',
                value: data.vusion.srcPath,
                description: `源文件目录。在项目中会自动注册别名'@'。`,
                group: '基础设置',
            }, {
                name: 'libraryPath',
                message: '项目库目录',
                type: 'input',
                default: '',
                value: data.vusion.libraryPath,
                description: `项目库目录。默认留空，表示与'srcPath'一致。在项目中会自动注册别名'@@'。`,
                group: '基础设置',
            }, {
                name: 'baseCSSPath',
                message: '基础样式路径',
                type: 'input',
                default: '',
                value: data.vusion.baseCSSPath,
                description: `基础样式（如 reset 样式）的路径。默认留空，会查找'@/base/base.css'。在项目中会自动注册别名'baseCSS'。`,
                group: '基础设置',
            }, {
                name: 'globalCSSPath',
                message: '全局变量样式路径',
                type: 'input',
                default: '',
                value: data.vusion.globalCSSPath,
                description: `全局变量样式（会注入到每个组件中）的路径。默认留空，会查找'@/base/global.css'。在项目中会自动注册别名'globalCSS'。`,
                group: '基础设置',
            }],
        }),

        async onWrite({ data, prompts, api }) {
            const result = {};
            await Promise.all(prompts.map((prompt) => api.getAnswer(prompt.id)
                .then((answer) => result[prompt.id] = answer)));
            api.assignData('vusion', result);
        },
    });

    api.describeTask({
        match: /vue-cli-service library-build.+?--vusion-mode raw/,
        description: '构建库（原生模式，不处理 babel、font、sprite 等）',
        icon: 'archive',
        // link:
    });

    api.describeTask({
        match: /vue-cli-service library-build(\s|$)/,
        description: '构建库',
        icon: 'archive',
        // link:
    });

    api.describeTask({
        match: /vue-cli-service doc(\s|$)/,
        description: '开发文档',
        icon: 'photo',
        // link:
    });

    api.describeTask({
        match: /vue-cli-service doc-build(\s|$)/,
        description: '构建文档',
        icon: 'photo_album',
        // link:
    });
};
