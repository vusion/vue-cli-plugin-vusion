module.exports = {
    pages: {
        index: {
            entry: './src/views/index/index.js',
            template: './src/views/index/index.html',
            filename: 'index.html',
            chunks: ['chunk-vendors', 'chunk-common', 'index'],
        },
        dashboard: {
            entry: './src/views/dashboard/index.js',
            template: './src/views/dashboard/index.html',
            filename: 'dashboard.html',
            chunks: ['chunk-vendors', 'chunk-common', 'dashboard'],
        },
        login: {
            entry: './src/views/login/index.js',
            template: './src/views/login/index.html',
            filename: 'login.html',
            chunks: ['chunk-vendors', 'chunk-common', 'login'],
        },
    },
    runtimeCompiler: true,
};
