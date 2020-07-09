const fs = require('fs');
const path = require('path');

function predesigner() {
    function readAndWriteFile(filePath, newRelativePath = '', handler) {
        let content = fs.readFileSync(filePath, 'utf8');
        content = handler(content);
        const newPath = path.resolve(filePath, newRelativePath);
        fs.writeFileSync(newPath, content, 'utf8');
        return newPath;
    }

    const vueTemplateCompilerPath = require.resolve('vue-template-compiler');
    const vueTemplateCompilerBrowserPath = path.resolve(vueTemplateCompilerPath, '../browser.js');
    const vueTemplateCompilerBuildPath = path.resolve(vueTemplateCompilerPath, '../build.js');
    readAndWriteFile(vueTemplateCompilerBrowserPath, '', (content) => content
        .replace(/(ast = parse\(template\.trim\(\), options\);)\s+(if|optimize)/g, `$1
                        (options.plugins || []).forEach((plugin) => plugin(ast, options, exports));
                    $2`)
        .replace('exports.compile = compile;\n  exports.compileToFunctions', 'exports.compile = compile;\n  exports.generate = generate;\n  exports.compileToFunctions')
        .replace('exports.ssrCompile = compile$1;\n  exports.ssrCompileToFunctions', 'exports.ssrCompile = compile$1;\n  exports.ssrGenerate = generate$1;\n  exports.ssrCompileToFunctions'));

    readAndWriteFile(vueTemplateCompilerBuildPath, '', (content) => content
        .replace(/(ast = parse\(template\.trim\(\), options\);)\s+(if|optimize)/g, `$1
                    (options.plugins || []).forEach((plugin) => plugin(ast, options, exports));\n$2`)
        .replace('exports.compile = compile;\nexports.compileToFunctions', 'exports.compile = compile;\nexports.generate = generate;\nexports.compileToFunctions')
        .replace('exports.ssrCompile = compile$1;\nexports.ssrCompileToFunctions', 'exports.ssrCompile = compile$1;\nexports.ssrGenerate = generate$1;\nexports.ssrCompileToFunctions'));

    const vueLoaderPath = require.resolve('vue-loader');
    // const templateLoaderPath = path.resolve(vueLoaderPath, '../loaders/templateLoader.js');
    // readAndWriteFile(templateLoaderPath, '', (content) => content
    //     .replace('scopeId: query.scoped ? `data-v-${id}` : null,\n    comments', 'scopeId: query.scoped ? `data-v-${id}` : null,\n'
    //     + `  filename: require('path').relative(loaderContext.rootContext, this.resourcePath),`
    //     + '\n    comments'));
    //     .replace('scopeId: query.scoped ? `data-v-${id}` : null,', 'scopeId: `data-v-${id}`,\n  filename: this.resourcePath,'));

    readAndWriteFile(vueLoaderPath, '', (content) => content
        .replace('const hasScoped = descriptor.styles.some(s => s.scoped)', 'const hasScoped = true'));
}

module.exports = predesigner;
!module.parent && predesigner();
