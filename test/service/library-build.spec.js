const path = require('path');
const gitClone = require('../helpers/gitClone');
const serve = require('../helpers/staticServerPuppeteer');
const sleep = require('../helpers/sleep');
const { expect } = require('chai');

describe('vue-cli-service library-build', () => {
    const project = gitClone('https://github.com/vusion/cloud-ui.git');

    it('cloud-ui', async () => {
        project.exec('npm run build');
        // expect(project.has('dist/index.js')).to.be.true;
        // expect(project.has('dist/index.css')).to.be.true;
        expect((await project.read('dist/index.js')).includes('const ')).to.be.false;
        expect((await project.read('dist/index.css')).includes('icon-font:url(')).to.be.false;

        await serve({
            root: path.join(process.cwd(), 'dist'),
            url: '/demo.html',
        }, async ({ page, helpers }) => {
            expect((await helpers.getText('a[class^="u-button"]')).trim()).that.includes('Click me');
            page.click('a[class^="u-button"]')
            await sleep(1000);
            expect(await helpers.getText('[class^="u-modal_title"]')).to.equal('提示');
            expect(await helpers.getText('[class^="u-modal_content"]')).to.equal('Hello World!');
        });
    });

    it('cloud-ui:raw', async () => {
        project.exec('npm run build:raw');
        // expect(project.has('dist-raw/index.js')).to.be.true;
        // expect(project.has('dist-raw/index.css')).to.be.true;
        expect(await project.read('dist-raw/index.js')).that.includes('const ');
        expect(await project.read('dist-raw/index.css')).that.includes('icon-font:url(');
    });
});
