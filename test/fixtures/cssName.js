const cssStrings = [{
    value: ".button",
    result: ".button[class]"
},{
    value: ".button:hover",
    result: ".button[class]:hover"
},{
    value: ".button, .test",
    result: ".button[class], .test"
},{
    value: ".button,.test",
    result: ".button[class],.test"
},{
    value: ".button .test",
    result: ".button[class] .test"
},{
    value: ".button.test",
    result: ".button[class].test"
},{
    value: ".test.button",
    result: ".test.button[class]"
},{
    value: ".test .button",
    result: ".test .button[class]"
},{
    value: ".test .button",
    result: ".test .button[class]"
},{
    value: ".button-test",
    result: ".button-test"
},{
    value: ".buttonTest",
    result: ".buttonTest"
},{
    value: ".buttonTest:hover",
    result: ".buttonTest:hover"
},{
    value: ".buttontest",
    result: ".buttontest"
},{
    value: ".button_test",
    result: ".buttontest"
},{
    value: ".button012",
    result: ".button012"
},{
    value: ".button012.test",
    result: ".button012.test"
}];
const regx = /\.button(?![-_a-zA-Z0-9])/g;
for (const item of cssStrings) {
    const result = item.value.replace(/\.button(?![-_a-zA-Z0-9])/g, (n) => {
        return n + '[class]'
    });
    console.log(item.value, result);
}