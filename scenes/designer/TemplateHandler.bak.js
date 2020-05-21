'use strict';

Object.defineProperty(exports, '__esModule', { value: true });
class ASTNodePath {
    constructor(node, parent, route = '') {
        this.node = node;
        this.parent = parent;
        this.route = route;
    }

    remove() {
        const index = this.parent.children.indexOf(this.node);
        ~index && this.parent.children.splice(index, 1);
    }
}
exports.ASTNodePath = ASTNodePath;
class TemplateHandler {
    constructor(code = '', options, compiler) {
        this.code = code;
        this.ast = this.parse(code);
        this.options = {
            tabLength: 4,
            startLevel: 0,
        };
        this.compiler = compiler;
    }

    parse(code) {
        const compilerOptions = {
            preserveWhitespace: false,
            outputSourceRange: true,
        };
        return this.compiler.compile(code, compilerOptions).ast;
    }

    generate() {
        // @TODO: 暂时没有很好的 generate
        const tabs = ' '.repeat(this.options.tabLength * this.options.startLevel);
        return tabs + this.generateElement(this.ast, this.options.startLevel) + '\n';
        // return this.code;
    }

    generateElement(el, level) {
        const tabs = ' '.repeat(this.options.tabLength * level);
        const insideTabs = ' '.repeat(this.options.tabLength * (level + 1));
        let shouldFormat = true;
        const content = el.children.map((node) => {
            let text = '';
            if (node.type === 1)
                text = (shouldFormat ? '\n' + insideTabs : '') + this.generateElement(node, level + 1);
            else if (node.type === 2)
                text = node.text;
            else if (node.type === 3)
                text = node.text;
            else
                console.log(node);
            shouldFormat = node.type === 1;
            return text;
        }).join('');
        if (!content)
            shouldFormat = false;
        const attrs = Object.keys(el.attrsMap).map((key) => `${key}="${el.attrsMap[key]}"`);
        let attrsLength = 0;
        let attrsString = '';
        attrs.forEach((attr) => {
            if (attrsLength >= 120 || attr.length >= 120) {
                attrsString += '\n' + tabs + ' '.repeat(3); // ' '.repeat(el.tag.length + 1);
                attrsLength = 0;
            }
            attrsString += ' ' + attr;
            attrsLength += attr.length;
        });
        return `<${el.tag}${attrs.length ? attrsString : ''}>` + content + (shouldFormat ? '\n' + tabs : '') + `</${el.tag}>`;
    }

    traverse(func) {
        let queue = [];
        queue = queue.concat(new ASTNodePath(this.ast, null, ''));
        let nodePath;
        while ((nodePath = queue.shift())) {
            if (nodePath.node.type === 1) {
                const parent = nodePath.node;
                queue = queue.concat(parent.children.map((node, index) => new ASTNodePath(node, parent, nodePath.route + '/' + index)));
            }
            const result = func(nodePath);
            if (result !== undefined)
                return result;
        }
    }

    findByRoute(route, node) {
        route = route.slice(1);
        const arr = route.split('/');
        if (!route || !arr.length)
            return node;
        else
            return this.findByRoute(arr.slice(1).join('/'), node.children[+arr[0]]);
    }
}
exports.default = TemplateHandler;
