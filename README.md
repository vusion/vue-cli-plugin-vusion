# vue-cli-plugin-vusion

Vue CLI Plugin for Vusion Projects

[![CircleCI][circleci-img]][circleci-url]
[![NPM Version][npm-img]][npm-url]
[![Dependencies][david-img]][david-url]
[![NPM Download][download-img]][download-url]

[circleci-img]: https://img.shields.io/circleci/project/github/vusion/vue-cli-plugin-vusion.svg?style=flat-square
[circleci-url]: https://circleci.com/gh/vusion/vue-cli-plugin-vusion
[npm-img]: http://img.shields.io/npm/v/vue-cli-plugin-vusion.svg?style=flat-square
[npm-url]: http://npmjs.org/package/vue-cli-plugin-vusion
[david-img]: http://img.shields.io/david/vusion/vue-cli-plugin-vusion.svg?style=flat-square
[david-url]: https://david-dm.org/vusion/vue-cli-plugin-vusion
[download-img]: https://img.shields.io/npm/dm/vue-cli-plugin-vusion.svg?style=flat-square
[download-url]: https://npmjs.org/package/vue-cli-plugin-vusion

![screenshot](./screenshot.png)

## Options

- `vusion.config.js`的`outputPath`属性
    - 覆盖了`vue.config.js`中的`outputDir`属性
    - 默认为`'public'`
- `vusion.config.js`的`publicPath`属性
    - 覆盖了`vue.config.js`中的`publicPath`属性
    - 默认为`''`

## vue-cli-service Commands

### 全局

- 增加了 alias
- 增加了 vue-multifile-loader
- 对 CSS 做了处理

### library-build

专门针对库进行构建。

### library-build --mode raw

专门针对库进行构建（原生模式，不处理 babel、font、sprite 等）

### doc

开发文档，启动文档的 dev 服务。

### doc-build

构建文档。

## UI

增加了 Vusion Config 的配置界面。

## Addon

正在开发中...

## Changelog

See [Releases](https://github.com/vusion/vue-cli-plugin-vusion/releases)

## Contributing

See [Contributing Guide](https://github.com/vusion/DOCUMENTATION/issues/8)

## License

[MIT](LICENSE)
