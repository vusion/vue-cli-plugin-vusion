const fs = require('fs');
const path = require('path');

const DOM_LIST = ['html', 'base', 'head', 'link', 'meta', 'meta ', 'script', 'style', 'title', 'body', 'address', 'article', 'aside', 'footer', 'header', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'hgroup', 'main', 'nav', 'section', 'blockquote', 'cite', 'dd', 'dl', 'dt', 'dir', 'div', 'figcaption', 'figure', 'hr', 'li', 'ol', 'ul', 'menu', 'p', 'pre', 'a', 'abbr', 'b', 'bdi', 'bdo', 'br', 'code', 'data', 'time', 'dfn', 'em', 'i', 'kbd', 'mark', 'q', 'rb', 'ruby', 'rp', 'rt', 'rtc', 's', 'del', 'ins', 'samp', 'small', 'span', 'strong', 'sub', 'sup', 'tt', 'u', 'var', 'wbr', 'area', 'audio', 'src', 'source', 'img', 'map', 'track', 'video', 'applet', 'embed', 'iframe', 'noembed', 'object', 'param', 'picture', 'canvas', 'noscript', 'caption', 'table', 'col', 'colgroup', 'tbody', 'td', 'tfoot', 'th', 'scope', 'headers', 'thead', 'tr', 'button', 'datalist', 'fieldset', 'form', 'input', 'label', 'legend', 'meter', 'optgroup', 'select', 'option', 'output', 'progress', 'textarea', 'details', 'dialog', 'menuitem', 'summary', 'content', 'slot', 'element', 'template', 'acronym', 'basefont', 'font', 'bgsound', 'big', 'blink', 'center', 'command', 'frame', 'frameset', 'image', 'isindex', 'keygen', 'listing', 'marquee', 'multicol', 'nextid', 'nobr', 'noframes', 'plaintext', 'shadow', 'spacer', 'strike', 'xmp', 'animate', 'animateMotion', 'animateTransform', 'circle', 'clipPath', 'color-profile', 'defs', 'desc', 'discard', 'ellipse', 'feBlend', 'feColorMatrix', 'feComponentTransfer', 'feComposite', 'feConvolveMatrix', 'feDiffuseLighting', 'feDisplacementMap', 'feDistantLight', 'feDropShadow', 'feFlood', 'feFuncA', 'feFuncB', 'feFuncG', 'feFuncR', 'feGaussianBlur', 'feImage', 'feMerge', 'feMergeNode', 'feMorphology', 'feOffset', 'fePointLight', 'feSpecularLighting', 'feSpotLight', 'feTile', 'feTurbulence', 'filter', 'foreignObject', 'g', 'hatch', 'hatchpath', 'line', 'linearGradient', 'marker', 'mask', 'mesh', 'meshgradient', 'meshpatch', 'meshrow', 'metadata', 'mpath', 'path', 'pattern', 'polygon', 'polyline', 'radialGradient', 'rect', 'set', 'solidcolor', 'stop', 'svg', 'switch', 'symbol', 'text', 'textPath', 'tspan', 'unknown', 'use', 'view'];

exports.getClassName = function getClassName(styleStr) {
    if (/^\$style\[['"](.*)['"]\]$/g.test(styleStr)) {
        const classNameVarName = /^\$style\[['"](.*)['"]\]$/g.exec(styleStr);
        if (classNameVarName)
            return classNameVarName[1];
    } else if (/^\$style./g.test(styleStr)) {
        const classNameVarName = styleStr.split('.')[1];
        if (classNameVarName)
            return classNameVarName;
    }
    return undefined;
};

exports.replaceSelector = function replaceSelector(selector, classList, suffix = ':not(html)') {
    const classListStr = classList.join('|');
    return selector.replace(new RegExp(`\\.(${classListStr})(?![-_a-zA-Z0-9]|\\[class\\])`, 'g'), (n) => n + suffix);
};

exports.getBindingClasses = function getBindingClasses(filePath) {
    return new Promise((res, rej) => {
        if (!/\.vue$/g.test(filePath))
            return res();

        const existing = fs.existsSync(filePath) && fs.statSync(filePath).isFile();
        if (!existing) {
            filePath = path.join(filePath, 'index.html');
            if (!fs.existsSync(filePath))
                return res();
        }

        fs.readFile(filePath, (err, data) => {
            if (err)
                return rej(err);
            if (!data)
                return res();

            const classSet = new Set();
            const content = String(data);

            const pushClass = (styleStr) => {
                const className = exports.getClassName(styleStr);
                if (className)
                    classSet.add(className);
            };
            content.replace(/<([^>\s]+)?\s.*:class="([^"]+)"/g, (m, $1, $2) => {
                if (!DOM_LIST.includes($1) && $1 !== '!--') {
                    const className = $2;
                    if (/^\[.*\]$/g.test(className)) {
                        const result = /^\[(.*)\]$/g.exec(className);
                        const contents = result[1].split(',').filter((item) => item).map((item) => item.trim());
                        for (const item of contents) {
                            pushClass(item);
                        }
                    } else
                        pushClass(className);
                }
                return m;
            });
            res(Array.from(classSet));
        });
    });
};
