<template>
<div v-show="rectStyle" :class="$style.root" :mode="mode" :style="rectStyle"
    :tabindex="mode === 'selected' ? 0 : ''" @keyup="onKeyUp"
    draggable="true" @dragstart="onDragStart($event)" @dragend="onDragEnd($event)">
    <div :class="$style.bar">
        <span :class="$style.tag">{{ info.tag }}</span>
        <!-- <span :class="$style.icon" role="add"></span>
        <span :class="$style.icon" role="duplicate"></span> -->
        <span :class="$style.icon" role="duplicate" @click="duplicate"></span>
        <span :class="$style.icon" role="remove" @click="remove"></span>
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
            e.dataTransfer.setDragImage(this.info.el, 0, 0);
            e.dataTransfer.setData('application/json', JSON.stringify({
                nodePath: this.info.nodePath,
                command: 'changeNode',
            }));
            this.$emit('dragstart');
        },
        onDragEnd(e) {
            this.$emit('dragend');
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
    border: 1px solid white;
    outline: 1px dashed #4a88e8;
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
    top: -20px;
    right: -1px;
    background: #4a88e8;
    padding: 0 4px;
    font-size: 12px;
    color: white;
    white-space: nowrap;
    pointer-events: auto;
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

.icon[role="duplicate"]::before {
    icon-font: url('../assets/add_to_photos.svg');
}
</style>
