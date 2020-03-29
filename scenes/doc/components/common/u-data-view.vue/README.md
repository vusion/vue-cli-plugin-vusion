# DataView（数据视图）

## 示例
### 最简形式

``` html
<u-data-view-node :value="{
    test1: null,
    test2: undefined,
    test5: 'string',
    test6: [1, 2, 'abc'],
    number: {
        test4: 123,
        test3: Infinity,
        test4: NaN,
    }
}" :expanded="true"></u-data-view-node>
```

### 基本形式

``` html
<u-data-view>
    <u-data-view-node :value="{
        test1: null,
        test2: undefined,
        test5: 'string',
        test6: [1, 2, 'abc'],
        number: {
            test4: 123,
            test3: Infinity,
            test4: NaN,
        }
    }" :expanded="true"></u-data-view-node>
    <u-data-view-node :value="{}" :expanded="true"></u-data-view-node>
    <u-data-view-node :value="[1, 2, 3]" :expanded="true"></u-data-view-node>
    <u-data-view-node :value="[]" :expanded="true"></u-data-view-node>
</u-data-view>
```

``` html
<u-data-view :value="{
    test1: null,
    test2: undefined,
    test5: 'string',
    test6: [1, 2, 'abc'],
    number: {
        test4: 123,
        test3: Infinity,
        test4: NaN,
    }
}"></u-data-view>
```

### 只读和禁用

``` html
<u-data-view readonly :value="{
    test1: null,
    test2: undefined,
    test5: 'string',
    test6: [1, 2, 'abc'],
    number: {
        test4: 123,
        test3: Infinity,
        test4: NaN,
    }
}"></u-data-view>
<u-data-view disabled :value="{
    test1: null,
    test2: undefined,
    test5: 'string',
    test6: [1, 2, 'abc'],
    number: {
        test4: 123,
        test3: Infinity,
        test4: NaN,
    }
}"></u-data-view>
```
