const gitClone = require('../helpers/gitClone');
const serve = require('../helpers/staticServerPuppeteer');
const sleep = require('../helpers/sleep');
const { expect } = require('chai');

describe('vue-cli-service build', () => {
    it('cloud-admin-lite', async () => {
        const project = gitClone('https://github.com/vusion-templates/cloud-admin-lite.git');
        project.exec('npm run build');

        await serve({
            root: project.dir,
            url: '/public/index.html',
        }, async ({ page, helpers }) => {
            expect((await helpers.getText('[class^="u-sidebar_item"][selected]')).trim()).to.equal('总览');
            expect((await helpers.getText('[class^="s-navbar-right_username"]')).trim()).to.equal('username');

            await page.evaluate(() => location = '#/demo/form/basic');
            await sleep(1000);
            expect((await helpers.getText('[class^="u-sidebar_item"][selected]')).trim()).to.equal('基础表单');
            expect((await helpers.getText('[class^="u-radios_radio"]')).trim()).to.equal('包年包月');
        });
    });
});
