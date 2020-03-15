<template>
    <div :class="$style.root">
        <div v-show="!focused" :class="$style.init" @click="focused = true"></div>
        <div v-show="focused" :class="$style.layouts">
            <div :class="$style.close" @click="focused = false"></div>
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
</template>

<script>
export default {
    name: 'd-slot',
    props: {
        tag: { type: String, default: 'div' },
    },
    data() {
        return {
            focused: false,
        };
    },
    methods: {
        select(type) {
            this.send({ command: 'addLayout', type });
        },
        send(message) {
            console.log('[vscode] Send: ' + JSON.stringify(message));
            window.parent.postMessage(message, '*');
        },
    },
};
</script>

<style module>
.root {
    border: 2px dashed #d5dadf;
    background-color: hsla(0,0%,100%,.5);
    transition: all 0.2s;
}

.root[display="inline"] {
    display: inline-block;
    vertical-align: top;
    min-width: 300px;
}

.init {
    cursor: pointer;
    text-align: center;
    color: #c5cbd0;
    transition: color 0.2s;
}

.init::before {
    font-size: 28px;
    content: '+';
    line-height: 27px;
    vertical-align: 2px;
}

.root[display="inline"] .init::before {
    line-height: 23px;
    vertical-align: 0;
}

.root:hover .init {
    color: #959da3;
}

.h3 {
    font-size: 14px;
    text-align: left;
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
    fill: #d8dfe7;
    transition: fill 0.2s;
    outline: 1px dashed #d8dfe7;
    outline-offset: 1px;
    transition: all 0.2s;
}

.layout:hover svg {
    outline-color: #6d7882;
    fill: #6d7882;
}

.close {
    position: absolute;
    cursor: pointer;
    top: 15px;
    right: 15px;
    line-height: 1em;
    color: #c5cbd0;
    transition: color 0.2s;
}

.close:hover {
    color: #959da3;
}

.close::after {
    font-size: 28px;
    content: '×';
}
</style>
