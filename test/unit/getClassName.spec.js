const { getClassName } = require('../../webpack/loaders/module-class-priority-loader/utils');
const expect = require('chai').expect;
const testValues = [{
    value: '$style.test',
    result: 'test',
}, {
    value: '$style["test"]',
    result: 'test',
}, {
    value: "$style['test']",
    result: 'test',
}, {
    value: '$style["test-1"]',
    result: 'test-1',
}, {
    value: '$style["test-1$wewe12"]',
    result: 'test-1$wewe12',
}, {
    value: '$style["112-tesrr"]',
    result: '112-tesrr',
}];

describe('replace class in selector', () => {
    it('selectName', () => {
        for (const item of testValues) {
            expect(getClassName(item.value)).to.equal(item.result);
        }
    });
});
