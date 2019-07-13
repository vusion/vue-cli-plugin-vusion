const path = require('path');
module.exports = function (vusionConfig) {
    let resolveModules;
    if (vusionConfig.resolvePriority === 'cwd')
        resolveModules = [
            path.resolve(process.cwd(), 'node_modules'),
            path.resolve(__dirname, '../node_modules'),
            path.resolve(__dirname, '../../'),
            'node_modules'];
    else if (vusionConfig.resolvePriority === 'current')
        resolveModules = [
            'node_modules',
            path.resolve(process.cwd(), 'node_modules'),
            path.resolve(__dirname, '../node_modules'),
            path.resolve(__dirname, '../../')];
    else
        resolveModules = [
            path.resolve(__dirname, '../node_modules'),
            path.resolve(__dirname, '../../'),
            'node_modules'];
    return resolveModules;
};
