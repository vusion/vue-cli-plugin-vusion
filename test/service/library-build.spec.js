const gitClone = require('../helpers/gitClone');

describe('vue-cli-service library-build', () => {
    it('cloud-ui', () => {
        const project = gitClone('https://github.com/vusion/cloud-ui.git');
        project.exec('npm run build');
        project.exec('npm run build:raw');
        project.exec('npm run build:docs');
    });
});
