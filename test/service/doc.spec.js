/* eslint-disable no-unused-expressions */
const gitClone = require('../helpers/gitClone');
const serve = require('../helpers/serveWithPuppeteer');
const shell = require('shelljs');
const { expect } = require('chai');
const sleep = require('../helpers/sleep');

describe('vue-cli-service doc', () => {
    it('cloud-ui', async () => {
        const project = gitClone('https://github.com/vusion/cloud-ui.git');

        await serve(
            () => project.execa('npm run dev'),
            async ({ page, nextUpdate, helpers }) => {
                expect((await helpers.getText('h1')).trim()).that.includes('Quickstart');
                expect((await helpers.getText('[class^="u-navbar_item"][selected]')).trim()).to.equal('基础组件');

                page.click('a[href="#/components/u-button"]');
                await sleep(1000);
                expect((await helpers.getText('h1')).trim()).that.includes('UButton');
                expect(await helpers.hasElement('h3#设置形状')).to.be.true;
                expect(await helpers.hasElement('[class^="u-button"][color="danger"]')).to.be.true;

                page.click('a[title="API"]');
                await sleep(1000);
                expect(await helpers.hasElement('h3#events')).to.be.true;
                expect(await helpers.hasElement('h4#before-navigate')).to.be.true;
            },
        );
    });
});
