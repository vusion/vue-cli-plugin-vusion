const cloneAndRun = require('../helpers/cloneAndRun');

describe('vue-cli-service build', () => {
    it('cloud-admin-lite', () => {
        cloneAndRun('https://github.com/vusion-templates/cloud-admin-lite.git', 'npm run build');
    });
});
