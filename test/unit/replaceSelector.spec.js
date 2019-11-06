const { replaceSelector } = require('../../webpack/loaders/module-class-priority-loader/utils');
const classList = ['test', 'test1'];
const expect = require('chai').expect;
const fixed = ':not(html)';
const testValues = [{
    value: '.test',
    result: '.test:not(html)',
}, {
    value: '.test>div',
    result: '.test:not(html)>div',
}, {
    value: '.test div',
    result: '.test:not(html) div',
}, {
    value: '.test:not(div)',
    result: '.test:not(html):not(div)',
}, {
    value: '.test:hover',
    result: '.test:not(html):hover',
}, {
    value: '.test::after',
    result: '.test:not(html)::after',
}, {
    value: '.test div',
    result: '.test:not(html) div',
}, {
    value: '.test .test1 div',
    result: '.test:not(html) .test1:not(html) div',
}, {
    value: '.test .test1 .test2',
    result: '.test:not(html) .test1:not(html) .test2',
}, {
    value: '.test[test]',
    result: '.test:not(html)[test]',
}, {
    value: '.test[class]',
    result: '.test[class]',
}, {
    value: '.testReplace',
    result: '.testReplace',
}, {
    value: '.test,.test1,.test2',
    result: '.test:not(html),.test1:not(html),.test2',
}, {
    value: '.test .a1,.test1 a,.test2',
    result: '.test:not(html) .a1,.test1:not(html) a,.test2',
}];

describe('replace class in selector', () => {
    it('selectName', () => {
        for (const item of testValues) {
            expect(replaceSelector(item.value, classList, fixed)).to.equal(item.result);
        }
    });
});

