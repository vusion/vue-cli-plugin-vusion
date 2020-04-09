const createServer = require('./createServer');
const launchPuppeteer = require('@vue/cli-test-utils/launchPuppeteer');
const portfinder = require('portfinder');
// const sleep = require('./sleep');

module.exports = async function staticServerPuppeteer(options, test) {
    const port = await portfinder.getPortPromise();
    const server = await createServer({
        root: options.root,
        port,
    });

    const url = `http://localhost:${port}${options.url || ''}`;
    console.info('Puppeteer url:', url);
    const { page, browser } = await launchPuppeteer(url);
    let activeBrowser = browser;

    // await sleep(1000);
    await page.screenshot({ path: 'test.png' });
    const helpers = createHelpers(page);

    await test({ browser, page, helpers });
    await server.close();
    await browser.close();
    activeBrowser = null;
};

/* eslint-disable no-shadow */
function createHelpers(page) {
    return {
        getText: (selector) => page.evaluate((selector) => document.querySelector(selector).textContent, selector),

        hasElement: (selector) => page.evaluate((selector) => !!document.querySelector(selector), selector),

        hasClass: (selector, cls) => page.evaluate((selector, cls) => {
            const el = document.querySelector(selector);
            return el && el.classList.contains(cls);
        }, selector, cls),
    };
}
