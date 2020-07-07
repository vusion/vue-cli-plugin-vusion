<template>
<div :class="$style.root" :type="type" :display="display" :position="position" :expanded="expanded"
    :dragover="dragover" @dragover.prevent="onDragOver" @dragleave.prevent="onDragLeave" @drop.prevent="onDrop"
    v-if="slotsProps.isShow">
    <div :class="$style.wrap" @transitionend="onTransitionEnd" @webkitTransitionEnd="onTransitionEnd">
        <div :class="$style.init" v-if="type === 'layout'" :dragover="dragover" :title="POSITION_TEXT[position]" @click="onClickAdd"></div>
        <div :class="$style.init" v-else :dragover="dragover" @dragover.prevent="onDragOver" @dragleave.prevent="onDragLeave" @drop.prevent="onDrop"
            :title="POSITION_TEXT[position]" @click="onClickAdd"></div>
        <u-popup ref="popup" :class="$style.popup" :dragover="dragover" placement="bottom" @update:opened="onPopupOpen">
            <div @dragover.prevent="onDragOver" @dragleave.prevent="onDragLeave" @drop.prevent="onDrop">
                <div v-if="mode !== 'layout'" :class="$style.mode">
                    <div :class="$style.close" @click="close()"></div>
                    <u-linear-layout :class="$style.actions" direction="vertical" layout="block" gap="small">
                        <u-text color="primary" style="font-weight: bold">⬅︎ 请将需要添加的组件或区块拖拽到这里</u-text>
                        <div>或者你可以快捷选择以下功能：</div>
                        <template v-if="slotsProps.acceptType === 'recommanded'">
                            <u-button :class="$style.button" size="small" v-for="recommanded in slotsProps.recommandeds" :key="recommanded.name" @click="addRecommanded(recommanded)">
                                添加{{ recommanded.title || recommanded.name }}
                            </u-button>
                        </template>
                        <template v-else-if="slotsProps.acceptType === 'all'">
                            <template v-if="slotsProps.recommandeds && slotsProps.recommandeds.length">
                                <u-button :class="$style.button" size="small" v-for="recommanded in slotsProps.recommandeds" :key="recommanded.name" @click="addRecommanded(recommanded)">
                                    添加{{ recommanded.title || recommanded.name }}
                                </u-button>
                            </template>
                            <u-button :class="$style.button" size="small" @click="addNormalTemplate('text')">添加文字</u-button>
                            <u-button :class="$style.button" size="small" @click="addNormalTemplate('expression')">添加表达式</u-button>
                            <u-button :class="$style.button" size="small" @click="mode = 'layout'"><span :class="$style.icon" name="layout"></span> 添加布局</u-button>
                        </template>
                        <template v-else>
                            <u-button :class="$style.button" size="small" @click="addNormalTemplate('text')">添加文字</u-button>
                            <u-button :class="$style.button" size="small" @click="addNormalTemplate('expression')">添加表达式</u-button>
                            <u-button :class="$style.button" size="small" @click="mode = 'layout'" v-if="slotsProps.needLayout"><span :class="$style.icon" name="layout"></span> 添加布局</u-button>
                        </template>
                    </u-linear-layout>
                <!-- <span draggable="true" :class="$style.button" role="add" title="添加物料" :color="mode === 'add' ? 'primary' : ''"></span> -->
                <!-- <span :class="$style.button" role="layout" title="添加布局" @click="mode = 'layout'"></span>
                <div v-show="mode === 'add'" style="color: var(--brand-primary); margin-top: 10px;">请将需要添加的组件或区块拖拽到这里</div> -->
                </div>
                <div v-else-if="mode === 'layout'" :class="$style.layouts">
                    <div :class="$style.close" @click="close()"></div>
                    <div :class="$style['layouts-inner']">
                        <h3 :class="$style.h3">线性布局</h3>
                        <div :class="$style['layouts-group']">
                            <div :class="$style.layout" style="width: 30px; margin: 10px 20px;" title="垂直向下排列" @click="select('linear-vertical')">
                                <svg xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 60 80"><path d="M0,18.4H60V0H0Z M0,38.8H60V20.4H0Z M0,59.2H60V40.8H0Z" /></svg>
                            </div>
                            <div :class="$style.layout" title="左对齐排列" @click="select('linear-left')">
                                <svg xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 100 50"><path d="M18.4,0V50H0V0Z M38.8,0V50H20.4V0Z M59.2,0V50H40.8V0Z" /></svg>
                            </div>
                            <div :class="$style.layout" title="居中对齐排列" @click="select('linear-center')">
                                <svg xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 100 50"><path d="M38.8,0V50H20.4V0Z M59.2,0V50H40.8V0Z M79.6,0V50H61.2V0Z" /></svg>
                            </div>
                            <div :class="$style.layout" title="右对齐排列" @click="select('linear-right')">
                                <svg xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 100 50"><path d="M59.2,0V50H40.8V0Z M79.6,0V50H61.2V0Z M100,0V50H81.6V0Z" /></svg>
                            </div>
                            <div :class="$style.layout" title="两端对齐排列" @click="select('linear-two-side')">
                                <svg xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 100 50"><path d="M18.4,0V50H0V0Z M100,0V50H81.6V0Z" /></svg>
                            </div>
                            <div :class="$style.layout" title="水平均匀分布" @click="select('linear-space-between')">
                                <svg xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 100 50"><path d="M18.4,0V50H0V0Z M59.2,0V50H40.8V0Z M100,0V50H81.6V0Z" /></svg>
                            </div>
                        </div>
                        <h3 :class="$style.h3">栅格布局</h3>
                        <div :class="$style['layouts-group']">
                            <div :class="$style.layout" title="一栏栅格" @click="select('grid-1-1')">
                                <svg xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 100 50"><path d="M100,0V50H0V0Z" /></svg>
                            </div>
                            <div :class="$style.layout" title="两栏均匀栅格" @click="select('grid-2-2')">
                                <svg xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 100 50"><path d="M49,0V50H0V0Z M100,0V50H51V0Z" /></svg>
                            </div>
                            <div :class="$style.layout" title="三栏均匀栅格" @click="select('grid-3-3')">
                                <svg xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 100 50"><path d="M32,0V50H0V0Z M66,0V50H34V0Z M100,0V50H68V0Z" /></svg>
                            </div>
                            <div :class="$style.layout" title="四栏均匀栅格" @click="select('grid-4-4')">
                                <svg xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 100 50"><path d="M23.5,0V50H0V0Z M49,0V50H25.5V0Z M74.5,0V50H51V0Z M100,0V50H76.5V0Z" /></svg>
                            </div>
                            <div :class="$style.layout" title="左1/3栅格" @click="select('grid-(1+2)-3')">
                                <svg xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 100 50"><path d="M32.6667,0V50H0V0Z M100,0V50H34.6667V0Z" /></svg>
                            </div>
                            <div :class="$style.layout" title="右1/3栅格" @click="select('grid-(2+1)-3')">
                                <svg xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 100 50"><path d="M65.3333,0V50H0V0Z M100,0V50H67.3333V0Z" /></svg>
                            </div>
                            <div :class="$style.layout" title="左1/4*2栅格" @click="select('grid-(1+1+2)-4')">
                                <svg xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 100 50"><path d="M24,0V50H0V0Z M50,0V50H26V0Z M100,0V50H52V0Z" /></svg>
                            </div>
                            <div :class="$style.layout" title="右1/4*2栅格" @click="select('grid-(2+1+1)-4')">
                                <svg xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 100 50"><path d="M48,0V50H0V0Z M74,0V50H50V0Z M100,0V50H76V0Z" /></svg>
                            </div>
                            <div :class="$style.layout" title="左右各1/4栅格" @click="select('grid-(1+2+1)-4')">
                                <svg xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 100 50"><path d="M24,0V50H0V0Z M74,0V50H26V0Z M100,0V50H76V0Z" /></svg>
                            </div>
                            <div :class="$style.layout" title="五栏均匀栅格" @click="select('grid-5-5')">
                                <svg xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 100 50"><path d="M18.4,0V50H0V0Z M38.8,0V50H20.4V0Z M59.2,0V50H40.8V0Z M79.6,0V50H61.2V0Z M100,0V50H81.6V0Z" /></svg>
                            </div>
                            <div :class="$style.layout" title="六栏均匀栅格" @click="select('grid-6-6')">
                                <svg xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 100 50"><path d="M15,0V50H0V0Z M32,0V50H17V0Z M49,0V50H34V0Z M66,0V50H51V0Z M83,0V50H68V0Z M100,0V50H85V0Z" /></svg>
                            </div>
                            <div :class="$style.layout" title="左右各1/5栅格" @click="select('grid-(1+3+1)-5')">
                                <svg xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 100 50"><path d="M16,0V50H0V0Z M82,0V50H18V0Z M100,0V50H84V0Z" /></svg>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </u-popup>
    </div>
</div>
</template>

<script>
import Vue from 'vue';
export default {
    name: 'd-slot',
    props: {
        tag: { type: String, default: 'div' },
        display: { type: String, default: 'block' },
        position: { type: String, default: 'append' },
        nodeInfo: Object,
        slotName: String,
        nodeTag: String,
    },
    data() {
        return {
            expanded: false,
            mode: '',
            dragover: false,
            POSITION_TEXT: {
                append: '在内部追加',
                insertBefore: '在前面插入',
                insertAfter: '在后面插入',
            },
            NORMAL_TEMPLATE: {
                text: '<template> 文字 </template>',
                expression: "<template> {{ 'value' }} </template>",
            },
        };
    },
    computed: {
        type(type) {
            if (this.tag === 'u-linear-layout' || this.tag === 'u-grid-layout-column')
                return 'layout';
            else
                return 'default';
        },
        slotsProps() {
            if (this.slotName && Vue.prototype.ComponentsAPI) {
                const cloudui = Vue.prototype.ComponentsAPI[this.nodeTag];
                const slots = cloudui && cloudui.slots || [];
                const slot = slots.find((item) => item.name === this.slotName);
                const acceptType = slot && slot['accept-type'] ? slot['accept-type'] : 'all';
                let needLayout = true;
                if (Array.isArray(acceptType)) {
                    needLayout = acceptType.includes('block');
                }
                return {
                    isShow: !slot || slot['quick-add'] !== 'never',
                    acceptType,
                    recommandeds: !slot ? [] : slot.recommanded,
                    needLayout,
                };
            } else {
                return {
                    isShow: true,
                    acceptType: 'all',
                    recommandeds: [],
                    needLayout: true,
                };
            }
        },
    },
    created() {
        this.$watch(() => [this.expanded, this.mode], (result) => {
            this.$root.$emit('d-slot:mode-change', result);
        });
        if (!window.dslotPopper) {
            window.dslotPopper = [];
        }
    },
    methods: {
        close() {
            // this.expanded = false;
            this.mode = '';
            this.$refs.popup.close();
        },
        onClickAdd() {
            this.expanded = true;
            this.mode = 'add';
            this.sendCommand('readyToAdd');
        },
        select(type) {
            this.send({
                command: 'addLayout',
                position: this.position,
                type,
                nodePath: this.nodeInfo.nodePath,
                scopeId: this.nodeInfo.scopeId,
            });
        },
        send(data) {
            return this.$root.$emit('d-slot:send', data);
        },
        sendCommand(...args) {
            return this.$root.$emit('d-slot:sendCommand', ...args);
        },
        onDragOver(e) {
            this.dragover = true;
        },
        onDragLeave(e) {
            this.dragover = false;
        },
        onDrop(e) {
            this.dragover = false;
            const dataTransfer = e.dataTransfer;
            Array.from(dataTransfer.items).forEach((item) => console.info('[drop]', item.type, item.kind, dataTransfer.getData(item.type)));

            const code = dataTransfer.getData('text/plain');
            const nodeData = dataTransfer.getData('application/json') || '{}';
            this.send({
                command: 'addCode',
                position: this.position,
                code,
                nodePath: this.nodeInfo.nodePath,
                scopeId: this.nodeInfo.scopeId,
                nodeData,
            });

            this.close();
        },
        onTransitionEnd() {
            this.$root.$emit('d-slot:mode-change');
        },
        addNormalTemplate(type) {
            this.send({
                command: 'addCode',
                position: this.position,
                code: this.NORMAL_TEMPLATE[type],
                nodePath: this.nodeInfo.nodePath,
                scopeId: this.nodeInfo.scopeId,
                nodeData: JSON.stringify({
                    command: 'addBaseComponent',
                }),
            });
        },
        // 用于其他地方点击时可关闭弹层
        onPopupOpen(opened, element) {
            if (opened)
                window.dslotPopper.push(element);
            else {
                const index = window.dslotPopper.indexOf(element);
                ~index && window.dslotPopper.splice(index, 1);
            }
        },
        addRecommanded(recommanded) {
            const code = recommanded.snippet;
            if (!code)
                return;
            this.send({
                command: 'addCode',
                position: this.position,
                code,
                nodePath: this.nodeInfo.nodePath,
                scopeId: this.nodeInfo.scopeId,
                nodeData: JSON.stringify({
                    command: 'addBaseComponent',
                }),
            });
        },
    },
};
</script>

<style module>
.root {
    position: relative;
    user-select: none;
    min-width: 100px;
}

.wrap {
    position: absolute;
    height: 8px;
    top: auto;
    bottom: 4px;
    right: 8px;
    left: 8px;
}

.root[position="append"] {}

.root[position="insertBefore"] .wrap {
    right: 0;
    left: 0;
}

.root[position="insertAfter"] .wrap {
    top: 4px;
    bottom: auto;
    right: 0;
    left: 0;
}

.root[expanded] .wrap {
    position: static;
    height: auto;
    /* border: 1px solid hsla(216, 77%, 60%, 0.6); */
    cursor: initial !important;
    transition: all 0.2s;
    background: hsla(216, 77%, 80%, 0.3);
}

.root[expanded][dragover] .wrap {
    background: hsla(216, 77%, 60%, 0.6);
}

.root[display="inline"] {
    display: inline-block;
    vertical-align: top;
    min-width: 160px;
}

.init {
    text-align: center;
    color: hsla(216, 77%, 60%, 0.6);
    transition: all 0.2s;
    height: 100%;
    background: hsla(216, 77%, 80%, 0.3);
}

[root-app] .init {
    cursor: cell !important;
}

.root[dragover] .init, .init:hover {
    margin-top: -4px;
    height: 200%;
    background: hsla(216, 77%, 80%, 0.6);
}

.root[type="layout"] {
    padding: 0;
}

.root[type="layout"] .wrap {
    position: static;
    height: auto;
}

.root[type="layout"][dragover] .init,
.root[type="layout"] .init:hover {
    margin-top: 0;
    height: auto;
}

.root[type="layout"] .init::before {
    font-size: 24px;
    content: '+';
    line-height: 24px;
    vertical-align: 1px;
}

.root[display="inline"] .init::before {
    /* line-height: 24px;
    vertical-align: 0; */
}

.root:hover .wrap {
    border-color: hsla(216, 77%, 60%);
}

.root:hover .init {
    color: hsla(216, 77%, 60%);
}

.h3 {
    font-size: 14px;
    text-align: left;
}

.mode {
    text-align: center;
    padding: 30px 0;
}

.actions {
    width: 400px;
    margin: 0 auto;
    max-width: 90%;
}

.button {
    border-color: #abb3c5;
}

.button:hover {
    border-color: var(--brand-primary);
}

/* .button {
    display: inline-block;
    background: var(--background-color-base);
    border-radius: 100px;
    width: 72px;
    height: 72px;
    font-weight: bold;
    line-height: 72px;
    text-align: center;
    cursor: pointer;
}

.button:hover {
    background: var(--background-color-dark);
}

.button + .button {
    margin-left: 20px;
}

.button[color="primary"] {
    background: var(--brand-primary);
    color: white;
}

.button::before {
    font-size: 32px;
} */

.icon[name="add"]::before {
    icon-font: url('../assets/add-24px.svg');
}

.icon[name="layout"]::before {
    icon-font: url('../assets/view_quilt.svg');
}

.layouts {
    position: relative;
}

.layouts-inner {
    width: 442px;
    margin: 0 auto;
    padding: 20px;
    padding-top: 10px;
}

.layouts-group {
    margin: -10px;
}

.layout {
    cursor: pointer;
    width: 50px;
    margin: 10px;
    display: inline-block;
}

.layout svg {
    display: block;
    fill: rgba(0,0,0,0.3);
    transition: fill 0.2s;
    outline: 1px dashed rgba(0,0,0,0.3);
    outline-offset: 1px;
    transition: all 0.2s;
}

.layout:hover svg {
    outline-color: rgba(0,0,0,0.6);
    fill: rgba(0,0,0,0.6);
}

.close {
    position: absolute;
    cursor: pointer;
    top: 15px;
    right: 15px;
    line-height: 1em;
    color: #aab3c5;
    transition: color 0.2s;
}

.close:hover {
    color: #6c767d;
}

.close::after {
    font-size: 28px;
    content: '×';
}

.popup {
    background: #eef1f6;
    border-color: #abb3c5;
    z-index: 99999999;
}
.popup[x-placement^=bottom] > [class^="u-popup_arrow_"]{
    border-bottom-color: #eef1f6 !important;
}
.popup[x-placement^=top] > [class^="u-popup_arrow_"]{
    border-top-color: #eef1f6 !important;
}
.popup[x-placement^=bottom] > [class^="u-popup_arrow_"]::before {
    border-bottom-color: #abb3c5 !important;
}
.popup[x-placement^=top] > [class^="u-popup_arrow_"]::before {
    border-top-color: #abb3c5 !important;
}
.popup[dragover] {
    background: hsla(216, 77%, 90%);
}
.popup[dragover] > [class^="u-popup_arrow_"]{
    border-bottom-color: hsla(216, 77%, 90%) !important;
}
.popup[x-placement^=top][dragover] > [class^="u-popup_arrow_"]{
    border-top-color: hsla(216, 77%, 90%) !important;
}
</style>
