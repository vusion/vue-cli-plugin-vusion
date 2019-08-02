const path = require('path');
module.exports = {
    outputDir: path.join(process.cwd(), 'public'),
    publicPath: '',
    devServer: {
        quiet: false,
    },
};
