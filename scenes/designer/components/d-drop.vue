<template>
<div v-show="rectStyle" :class="$style.root" :style="rectStyle">
    <div :class="$style.mask" :style="maskStyle"></div>
    <div ref="dropNode"
        :class="$style.drop"
        :style="dragNodeStyle"
        :dragover="dragover"
        @dragover.prevent="onDragOver"
        @dragleave.prevent="onDragLeave"
        @drop.prevent="onDrop">
    </div>
</div>
</template>

<script>
import * as utils from '../utils';
export default {
    props: {
        info: Object,
        targetPosition: Object,
    },
    data() {
        return {
            dragover: false,
            rectStyle: undefined,
            position: 'insertBefore',
            dragNodeStyle: undefined,
            maskStyle: undefined,
        };
    },
    watch: {
        info: {
            handler(info) {
                this.computeStyle();
            },
            immediate: true,
        },
        targetPosition: {
            handler(info) {
                this.computeStyle();
            },
            immediate: true,
        },
    },
    methods: {
        computeStyle() {
            const el = this.info.el;
            if (el && el.nodeType === 1) {
                const rect = utils.getVisibleRect(el);
                const nodeStyle = getComputedStyle(el);
                if (this.targetPosition.y >= rect.top && this.targetPosition.y <= rect.top + rect.height && this.targetPosition.x >= rect.left && this.targetPosition.x <= rect.left + rect.width) {
                    const display = (nodeStyle.display || '').replace(/-block$/, '');
                    this.rectStyle = {
                        left: rect.left + 'px',
                        top: rect.top + 'px',
                    };
                    this.maskStyle = {
                        width: rect.width + 'px',
                        height: rect.height + 'px',
                    };
                    if (display === 'block') {
                        this.dragNodeStyle = {
                            width: rect.width + 'px',
                            height: '20px',
                        };
                        if (this.targetPosition.y >= rect.top && this.targetPosition.y <= rect.top + rect.height / 2) {
                            this.position = 'insertBefore';
                            this.dragNodeStyle.top = '-20px';
                        } else {
                            this.position = 'insertAfter';
                            this.dragNodeStyle.top = rect.height + 'px';
                        }
                    } else if (display === 'inline') {
                        this.dragNodeStyle = {
                            width: '20px',
                            height: rect.height + 'px',
                        };
                        if (this.targetPosition.x >= rect.left && this.targetPosition.x <= rect.left + rect.width / 2) {
                            this.position = 'insertBefore';
                            this.dragNodeStyle.left = '-20px';
                        } else {
                            this.position = 'insertAfter';
                            this.dragNodeStyle.left = rect.width + 'px';
                        }
                    }
                } else {
                    this.rectStyle = undefined;
                    this.maskStyle = undefined;
                    this.dragNodeStyle = undefined;
                }
            } else {
                this.rectStyle = undefined;
                this.maskStyle = undefined;
                this.dragNodeStyle = undefined;
            }
        },
        onDragOver(e) {
            this.dragover = true;
        },
        onDragLeave(e) {
            this.dragover = false;
        },
        onDrop(e) {
            this.dragover = false;
            this.rectStyle = undefined;
            const dataTransfer = e.dataTransfer;
            Array.from(dataTransfer.items).forEach((item) => console.info('[d-drop]', item.type, item.kind, dataTransfer.getData(item.type)));

            const code = dataTransfer.getData('text/plain');
            const nodeData = JSON.parse(dataTransfer.getData('application/json') || '{}');
            if (nodeData && nodeData.command === 'changeNode') {
                // 父拖到子里面，不允许，返回
                if (this.info.nodePath.startsWith(nodeData.nodePath))
                    return;
                this.$parent.send({
                    command: 'changeNode',
                    originPath: nodeData.nodePath,
                    targetPath: this.info.nodePath,
                    parentNodePath: this.info.parentNodePath,
                    position: this.position,
                });
            } else {
                this.$parent.send({
                    command: 'addCode',
                    position: this.position,
                    code,
                    nodePath: this.info.nodePath,
                    parentNodePath: this.info.parentNodePath,
                    scopeId: this.info.scopeId,
                    nodeData: JSON.stringify(nodeData),
                });
            }
        },
    },
};
</script>

<style module>
.root{
    position: fixed;
    min-width: 20px;
    min-height: 20px;
    z-index: 99999999;
}
.mask{
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 99999999;
    border: 1px solid white;
    outline: 1px dashed #4a88e8;
    outline-offset:  -1px;
    pointer-events: none;
}
.drop{
    position: absolute;
    width: 20px;
    height: 20px;
    background: hsla(213, 77%, 80%, 0.6);
}
.drop[dragover]{
    background: hsla(213, 77%, 80%);
}
</style>
