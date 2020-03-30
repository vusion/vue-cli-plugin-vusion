const cloneAndRun = require('../helpers/cloneAndRun');

describe('vue-cli-service library-build', () => {
    it('cloud-ui', () => {
        cloneAndRun('https://github.com/vusion/cloud-ui-material.git', [
            'npm run build:doc',
        ], { cwd: 'src/components/u-log-viewer.vue' });
    });
});
