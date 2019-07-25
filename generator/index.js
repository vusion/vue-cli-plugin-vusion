module.exports = (api) => {
    api.extendPackage({
        dependencies: {
            'proto-ui.vusion': '~0.4.0-alpha.4',
        },
    });
    // 渲染的模板？
    api.render('./template');
};
