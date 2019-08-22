module.exports = {
    root: true,
    extends: 'vusion/all',
    env: {
        browser: true,
        node: true
    },
    rules: {
        'no-console': process.env.NODE_ENV === 'production' ? 'error' : 'off',
        'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'off'
    },
};
