<template>
<div v-show="rectStyle"
    :class="$style.root"
    :style="rectStyle"
    :dragover="dragover"
    @dragover.prevent="onDragOver"
    @dragleave.prevent="onDragLeave"
    @drop.prevent="onDrop">
    <div :class="$style.drop"></div>
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
        };
    },
    watch: {
        info: {
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
                const nodeRect = utils.getVisibleRect(this.$el);
                const nodeStyle = getComputedStyle(el);
                if (this.targetPosition.y >= rect.top && this.targetPosition.y <= rect.top + rect.height && this.targetPosition.x >= rect.left && this.targetPosition.x <= rect.left + rect.width) {
                    const display = (nodeStyle.display || '').replace(/-block$/, '');
                    if (display === 'block') {
                        this.rectStyle = {
                            left: rect.left + 'px',
                            width: rect.width + 'px',
                        };
                        if (this.targetPosition.y >= rect.top && this.targetPosition.y <= rect.top + rect.height / 2) {
                            this.rectStyle.top = rect.top - nodeRect.height + 'px';
                            this.position = 'insertBefore';
                        } else {
                            this.rectStyle.top = rect.top + rect.height + nodeRect.height + 'px';
                            this.position = 'insertAfter';
                        }
                    } else if (display === 'inline') {
                        this.rectStyle = {
                            top: rect.top + 'px',
                            height: rect.height + 'px',
                        };
                        if (this.targetPosition.x >= rect.left && this.targetPosition.x <= rect.left + rect.width / 2) {
                            this.rectStyle.left = rect.left - nodeRect.width + 'px';
                            this.position = 'insertBefore';
                        } else {
                            this.rectStyle.left = rect.left + rect.width + 'px';
                            this.position = 'insertAfter';
                        }
                    }
                } else {
                    this.rectStyle = undefined;
                }
            } else {
                this.rectStyle = undefined;
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
                this.$parent.send({
                    command: 'changeNode',
                    originPath: nodeData.nodePath,
                    targetPath: this.info.nodePath,
                    parentTargetPath: this.info.parentNodePath,
                    position: this.position,
                });
            } else {
                this.$parent.send({
                    command: nodeData.command,
                    position: this.position,
                    code,
                    nodePath: this.info.nodePath,
                    scopeId: this.info.scopeId,
                    nodeData,
                });
            }
        },
    },
};
</script>

<style module>
.root{
    position: fixed;
    top: 0;
    left: 0;
    min-width: 20px;
    min-height: 20px;
    z-index: 99999999;
    background: hsla(213, 77%, 80%, 0.6);
    /* outline-offset:  -1px;
    pointer-events: none; */
}
.root[dragover]{
    background: hsla(213, 77%, 80%);
}
</style>
