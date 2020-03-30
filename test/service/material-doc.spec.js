const gitClone = require('../helpers/gitClone');
const serve = require('../helpers/serveWithPuppeteer');
const shell = require('shelljs');
const { expect } = require('chai');
const sleep = require('../helpers/sleep');

describe('vue-cli-service doc', () => {
    it('cloud-ui-materials', async () => {
        const project = gitClone('https://github.com/vusion-templates/cloud-ui-materials.git');
        shell.cd('src/components/u-chip.vue');

        await serve(
            () => {
                const child = project.execa('npm run dev')
                // child.stdout.pipe(process.stdout);
                return child;
            },
            async ({ page, nextUpdate, helpers }) => {
                console.log('puppeteer')
                expect((await helpers.getText('h1')).trim()).that.includes('UChip');
                expect((await helpers.getText('[class^="u-chip"]')).trim()).to.equal('Chip');

                page.click('a[title="API"]')
                await sleep(1000);
                expect(await helpers.hasElement('#events')).to.be.true;
                expect(await helpers.hasElement('#before-remove')).to.be.true;
            },
        );
    });
});
