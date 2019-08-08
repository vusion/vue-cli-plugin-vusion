const presets = [
    [
        '@babel/preset-env',
        {
            targets: {
                browsers: ['last 3 versions', 'not ie <= 8'],
            },
            modules: false,
            loose: true,
        },
    ],
];

module.exports = {
    presets,
    plugins: ['@babel/plugin-syntax-dynamic-import'],
};
