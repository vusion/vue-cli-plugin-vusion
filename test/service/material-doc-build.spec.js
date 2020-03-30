const gitClone = require('../helpers/gitClone');
const serve = require('../helpers/staticServerPuppeteer');
const shell = require('shelljs');
const path = require('path');
const { expect } = require('chai');
const sleep = require('../helpers/sleep');

describe('vue-cli-service doc-build', () => {
    it('cloud-ui-materials', async () => {
        const project = gitClone('https://github.com/vusion/cloud-ui-materials.git');
        shell.cd('src/components/u-chip.vue');
        project.exec('npm run build:doc');

        await serve({
            root: path.join(process.cwd(), 'public'),
            url: '/',
        }, async ({ page, helpers }) => {
            expect((await helpers.getText('h1')).trim()).that.includes('UChip');
            expect((await helpers.getText('[class^="u-chip"]')).trim()).to.equal('Chip');

            page.click('a[title="API"]')
            await sleep(1000);
            expect(await helpers.hasElement('#events')).to.be.true;
            expect(await helpers.hasElement('#before-remove')).to.be.true;
        });
    });
});
