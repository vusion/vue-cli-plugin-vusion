<template>
<div v-show="rectStyle" :class="$style.root" :mode="mode" :tag="info.tag" :style="rectStyle"
    :tabindex="mode === 'selected' ? 0 : ''" @keyup="onKeyUp"
    draggable="true" @dragstart="onDragStart($event)" @dragend="onDragEnd($event)">
    <div :class="$style.bar">
        <span :class="$style.tag">{{ info.title || info.tag }}</span>
        <!-- <span :class="$style.icon" role="add"></span>
        <span :class="$style.icon" role="duplicate"></span> -->
        <span :class="$style.icon" title="创建副本" role="duplicate" @click="duplicate"></span>
        <span :class="$style.icon" title="删除" role="remove" @click="remove"></span>
        <span :class="$style.icon" title="编辑模态框" role="modal" @click="edit(item)" v-for="(item, index) in ctrlList" :key="index"></span>
    </div>
</div>
</template>

<script>
import * as utils from '../utils';

export default {
    name: 'd-highlighter',
    props: {
        mode: { type: String, default: 'hover' },
        info: Object,
    },
    data() {
        return {
            rectStyle: undefined,
            ctrlList: [],
        };
    },
    watch: {
        info: {
            handler(info) {
                this.computeStyle();
                const el = this.info.el;
                if (el) {
                    const ctrl = info.el.getAttribute('ctrl') || '[]';
                    this.ctrlList = JSON.parse(ctrl).filter((i) => i);
                    this.ctrlList.forEach((item) => {
                        item.el = el;
                    });
                }
            },
            immediate: true,
        },
    },
    methods: {
        edit(item) {
            this.closeAll();
            let node = item.el.querySelector(item.selector);
            while (node && !node.__vue__) {
                node = node.parentElement;
            }
            if (node && node !== item.el && item.el.contains(node)) {
                node.__vue__[item.ctrl] = !node.__vue__[item.ctrl];
            }
        },
        closeAll() {
            this.ctrlList.forEach((item) => {
                let node = item.el.querySelector(item.selector);
                while (node && !node.__vue__) {
                    node = node.parentElement;
                }
                if (node && node !== item.el && item.el.contains(node)) {
                    node.__vue__[item.ctrl] = false;
                }
            });
        },
        computeStyle() {
            const el = this.info.el;
            if (el && el.nodeType === 1) {
                const rect = utils.getVisibleRect(el);
                this.rectStyle = {
                    top: rect.top + 'px',
                    left: rect.left + 'px',
                    width: rect.width + 'px',
                    height: rect.height + 'px',
                };
            } else {
                this.rectStyle = undefined;
            }
        },
        onKeyUp(e) {
            if (e.key === 'Backspace' || e.key === 'Delete')
                this.remove();
        },
        remove() {
            const nodeInfo = this.info;
            if (nodeInfo.el === this.$parent.contextVM.$el) {
                this.$parent.sendCommand('toast', '页面根节点不能删除！');
                return;
            }

            this.$parent.send({
                command: 'removeNode',
                type: nodeInfo.type,
                tag: nodeInfo.tag,
                scopeId: nodeInfo.scopeId,
                nodePath: nodeInfo.nodePath,
            });
        },
        duplicate() {
            const nodeInfo = this.info;
            if (nodeInfo.el === this.$parent.contextVM.$el) {
                this.$parent.sendCommand('toast', '页面根节点不能删除！');
                return;
            }

            this.$parent.send({
                command: 'duplicateNode',
                type: nodeInfo.type,
                tag: nodeInfo.tag,
                scopeId: nodeInfo.scopeId,
                nodePath: nodeInfo.nodePath,
            });
        },
        onDragStart(e) {
            e.dataTransfer.effectAllowed = 'copyMove';
            this.crt = this.info.el.cloneNode(true);
            const nodeStyle = getComputedStyle(this.info.el);
            this.crt.style.backgroundColor = nodeStyle.backgroundColor === 'rgba(0, 0, 0, 0)' ? 'white' : nodeStyle.backgroundColor;
            this.crt.style.position = 'absolute';
            this.crt.style.zIndex = -999;
            this.crt.style.top = -999 + 'px';
            this.crt.style.left = -999 + 'px';
            this.crt.style.width = nodeStyle.width;
            this.crt.style.height = nodeStyle.height;
            this.canvas2Image(this.crt);
            document.body.appendChild(this.crt);
            e.dataTransfer.setDragImage(this.crt, 0, 0);
            e.dataTransfer.setData('application/json', JSON.stringify({
                nodePath: this.info.nodePath,
                command: 'changeNode',
            }));
            this.$emit('dragstart');
        },
        onDragEnd(e) {
            document.body.removeChild(this.crt);
            this.$emit('dragend');
        },
        canvas2Image(node) {
            const canvas = Array.from(this.info.el.getElementsByTagName('canvas'));
            const canvasCopy = Array.from(node.getElementsByTagName('canvas'));
            if (!canvas.length)
                return;
            const stack = [];
            stack.push(node);
            let tempNode;
            while (stack.length) {
                tempNode = stack.pop();
                const children = tempNode.childNodes || [];
                if (children.length) {
                    for (let i = children.length - 1; i >= 0; i--) {
                        if (children[i].nodeType === 1 && children[i].tagName !== 'CANVAS')
                            stack.push(children[i]);
                    }
                }
                for (let i = children.length - 1; i >= 0; i--) {
                    if (children[i].tagName === 'CANVAS') {
                        const index = canvasCopy.indexOf(children[i]);
                        const image = new Image();
                        image.src = canvas[index].toDataURL('image/png');
                        children[i].style.display = 'none';
                        if (i === children.length - 1) {
                            tempNode.appendChild(image);
                        } else {
                            tempNode.insertBefore(image, children[i].nextSibling);
                        }
                    }
                }
            }
        },
    },
};
</script>

<style module>
.root {
    position: fixed;
    top: 0;
    left: 0;
    width: 200px;
    height: 200px;
    z-index: 99999999;
    outline: 1px solid #4a88e8;
    outline-offset:  -1px;
    pointer-events: none;
}

.root[mode="selected"] {

}

.root[mode="hover"] {
    opacity: 0.5;
}

.bar {
    position: absolute;
    top: -19px;
    background: #4a88e8;
    padding: 0 4px;
    font-size: 12px;
    color: white;
    white-space: nowrap;
    pointer-events: auto;
}

.tag {
    cursor: move;
}

.icon {
    margin-left: 4px;
    opacity: 0.5;
    transition: opacity 0.2s;
    cursor: pointer;
}

.icon:hover {
    opacity: 1;
}

.icon[role="remove"]::before {
    icon-font: url('../assets/delete.svg');
}
.icon[role="modal"]::before {
    font-size: 18px;
    line-height: 12px;
    vertical-align: middle;
    margin-top: -1px;
    display: inline-block;
    icon-font: url('../assets/弹窗.svg');
}

.icon[role="duplicate"]::before {
    icon-font: url('../assets/add_to_photos.svg');
}

.root[tag="d-router-view"] {
    outline-color: #8acd4e;
}

.root[tag="d-router-view"] .bar {
    background: #8acd4e;
}
</style>
