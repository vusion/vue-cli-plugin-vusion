const hash = require('hash-sum');
const vueTemplateCompiler = require('vue-template-compiler');

const VNodeMap = new Map();

/**
 * 基于样式选择器格式 (ie.「.root>.head>h1」) 生成 hash Id
 * @param  {Object} node
 * @return {String} hashId
 */
const genVusionId = (node) => {
    const selectors = [];

    while (node) {
        const index = node.parent && node.parent.children.indexOf(node);
        const selector = node.tag + (node.classBinding ? node.classBinding.replace(/^\$style/, '') : '') + (index !== undefined ? ':' + index : '');
        selectors.push(selector);
        node = node.parent;
    }
    return hash(selectors.reverse().join('>'));
};

/**
 * 重铸 AST，将原组件的事件禁用，添加 node id
 * @param  {Object} node 原 AST 树
 * @param  {String} moduleId 热替换模块 id
 * @return {Object} node
 */
const forgeAST = (moduleId, node, options) => {
    if (!node)
        return;

    const nodeId = genVusionId(node);
    const attrsId = [{
        name: 'vusion-node-id',
        value: `"${nodeId}"`,
    }, {
        name: 'vusion-module-id',
        value: `"${moduleId}"`,
    }];

    if (!VNodeMap.get(nodeId)) {
        VNodeMap.set(nodeId, node);
    }

    node.events && (node.events = null);

    if (node.hasOwnProperty('attrs')) {
        node.attrs = node.attrs.concat(attrsId);
    } else {
        node.attrs = attrsId;
    }

    if (node.children) {
        node.children.forEach((child) => child.type === 1 ? forgeAST(moduleId, child, options) : child);
    }

    return node;
};

const getVNodeMap = () => VNodeMap;

exports.genVusionId = genVusionId;
exports.forgeAST = forgeAST;
exports.getVNodeMap = getVNodeMap;
