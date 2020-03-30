const gitClone = require('../helpers/gitClone');
const shell = require('shelljs');

describe('vue-cli-service library-build', () => {
    it('cloud-ui-materials', () => {
        const project = gitClone('https://github.com/vusion/cloud-ui-materials.git');
        shell.cd('src/components/u-chip.vue');
        project.exec('npm run build:doc');
    });
});
