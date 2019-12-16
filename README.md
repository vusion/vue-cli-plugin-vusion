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

## Vusion Config

``` js
{
    type: '', // Vusion 项目类型，如：'app', 'library', 'component', 'block', 'repository'
    outputPath: '', // 可以覆盖 vue.config.js 的 `outputDir` 属性
    publicPath: '', // 可以覆盖 vue.config.js 的 `publicPath` 属性
    staticPath: '', // 设置静态文件目录，用于拷贝到 outputPath 下
    srcPath: './src', // 设置源文件目录
    libraryPath: '', // 设置项目库目录
    baseCSSPath: '', // 设置基础样式目录
    theme: undefined, // 选择主题
    applyTheme: false, // 是否应用主题
    docs: false, // 文档配置
    alias: { // 用于设置 Webpack 别名
        vue$: path.resolve(__dirname, 'node_modules/vue/dist/vue.esm.js'),
        'vue-i18n$': path.resolve(__dirname, 'node_modules/vue-i18n/dist/vue-i18n.esm.js'),
        'vue-router$': path.resolve(__dirname, 'node_modules/vue-router/dist/vue-router.esm.js'),
        '@': path.resolve(__dirname, 'src'),
        ...
    },
};
```

## Commands

### 全局

- 增加了 alias
- 增加了 vue-multifile-loader
- 对 CSS 做了处理

### library-build

专门针对库进行构建。

#### --theme

设置主题。

#### --vusion-mode raw

原生模式，不处理 babel、font、sprite 等。

#### --base-css

设置 Base CSS 的路径。

#### --cache

缓存库的打包。

#### --output-path

覆盖默认的 output.path。

#### --public-path

覆盖默认的 publicPath。

#### --src-path

覆盖默认的 srcPath。

#### --library-path

覆盖默认的 libraryPath。

### doc

开发文档，启动文档的 dev 服务。

### doc-build

构建文档。

## UI

增加了 Vusion Config 的配置界面。

## Changelog

See [Releases](https://github.com/vusion/vue-cli-plugin-vusion/releases)

## Contributing

See [Contributing Guide](https://github.com/vusion/DOCUMENTATION/issues/8)

## License

[MIT](LICENSE)
