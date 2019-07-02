const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
// const chokidar = require('chokidar');

const TYPES = ['library', 'app', 'html5', 'fullstack'];
const defaults = require('./defaults');

module.exports = function resolve(configsFile, theme) {
    const config = defaults;

    // const packagePath = config.packagePath = path.resolve(process.cwd(), 'package.json');
    Object.assign(config, configsFile);

    if (!TYPES.includes(config.type)) {
        console.error(chalk.bgRed(' ERROR '), 'Unknown project type!');
        process.exit(1);
    }

    config.srcPath = config.srcPath || './src';
    config.libraryPath = config.libraryPath || config.srcPath;
    // if (config.type === 'library') {
    //     config.docs = config.docs || {};

    //     if (process.env.NODE_ENV === 'development') {
    //         // 更新 docs 对象
    //         chokidar.watch([configPath, packagePath]).on('change', (path) => {
    //             const newConfig = getConfig(configPath, packagePath);
    //             config.docs = newConfig.docs || {};
    //         });
    //     }
    // }

    config.srcPath = path.resolve(process.cwd(), config.srcPath);
    config.libraryPath = path.resolve(process.cwd(), config.libraryPath);

    if (theme === 'src' || theme === 'default')
        theme = undefined;
    config.theme = theme;

    if (!config.globalCSSPath) {
        config.globalCSSPath = path.resolve(config.libraryPath, theme ? `../theme-${theme}/base/global.css` : './base/global.css');
        if (!fs.existsSync(config.globalCSSPath))
            config.globalCSSPath = path.resolve(config.srcPath, theme ? `../theme-${theme}/base/global.css` : './base/global.css');
        if (!fs.existsSync(config.globalCSSPath))
            config.globalCSSPath = path.resolve(require.resolve('@vusion/doc-loader'), 'node_modules/proto-ui.vusion/components/base/global.css');
    }
    if (!config.baseCSSPath) {
        config.baseCSSPath = path.resolve(config.libraryPath, './base/base.css');
        if (!fs.existsSync(config.baseCSSPath))
            config.baseCSSPath = path.resolve(config.srcPath, './base/base.css');
        if (!fs.existsSync(config.baseCSSPath))
            config.baseCSSPath = path.resolve(require.resolve('@vusion/doc-loader'), 'node_modules/proto-ui.vusion/components/base/base.css');
    }

    return config;
};
