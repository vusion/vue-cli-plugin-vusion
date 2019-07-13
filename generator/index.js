module.exports = (api) => {
    api.extendPackage({
        devDependencies: {
            '@babel/core': '^7.5.4',
            '@babel/preset-env': '^7.5.4',
            'babel-loader': '^8.0.6',
            '@babel/plugin-syntax-dynamic-import': '^7.2.0',
        },
    });
    api.extendPackage({
        scripts: {
            'vusion:dev': 'vue-cli-service vusion:dev',
        },
    });
    // 渲染的模板？
    // api.render('./template');
};
