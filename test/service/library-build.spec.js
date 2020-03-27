const cloneAndRun = require('../fixtures/cloneAndRun');

describe('vue-cli-service library-build', () => {
    it('library', () => {
        cloneAndRun('https://github.com/vusion-templates/library.git', [
            'npm run build',
            'npm run build:raw',
        ]);
    });

    it('cloud-ui', () => {
        cloneAndRun('https://github.com/vusion/cloud-ui.git', [
            'npm run build',
            'npm run build:raw',
            'npm run build:docs',
        ]);
    });
});
