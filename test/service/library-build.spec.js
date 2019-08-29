const run = require('../fixtures/run');

describe('vue-cli-service library-build', () => {
    it('library', () => {
        run('https://github.com/vusion-templates/library.git', [
            'npm run build',
            'npm run build-raw',
        ]);
    });

    it('library', () => {
        run('https://github.com/vusion/proto-ui.git', [
            'npm run build',
            'npm run doc-build',
        ], { branch: 'next' });
    });

    it('library', () => {
        run('https://github.com/vusion/cloud-ui.git', [
            'npm run build-all',
            // 'npm run doc-build-all',
        ], { branch: 'next' });
    });
});
