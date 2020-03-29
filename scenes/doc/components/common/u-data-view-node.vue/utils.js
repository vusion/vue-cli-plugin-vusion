const rawTypeRE = /^\[object (\w+)]$/;
const specialTypeRE = /^\[native \w+ (.*)\]$/;

const isPlainObject = (obj) => Object.prototype.toString.call(obj) === '[object Object]';
// const isPrimitive = (data) => {
//     if (data === null || data === undefined)
//         return true;
//     const type = typeof data;
//     return type === 'string' || type === 'number' || type === 'boolean';
// };

export const formatValue = (value) => {
    const type = typeof value;

    if (value === null)
        return 'null';
    else if (value === undefined)
        return 'undefined';
    else if (type === 'number' && isNaN(value))
        return 'NaN';
    else if (value === Infinity)
        return 'Infinity';
    else if (Array.isArray(value))
        return 'Array[' + value.length + ']';
    else if (type === 'object') {
        if (value.constructor.name === 'Object') {
            const ret = Object.keys(value)
                .map((key) => {
                    const val = value[key];
                    return `${key}: ${isPlainObject(val) ? 'Object' : formatValue(val)}`;
                }).join(', ');
            return `{ ${ret} }`;
            // return value; // return 'Object' + (Object.keys(value).length ? '' : ' (empty)');
        } else
            return value.constructor.name;
    } else if (type === 'native')
        return specialTypeRE.exec(value)[1];
    else if (type === 'string') {
        const typeMatch = value.match(rawTypeRE);
        if (typeMatch)
            return typeMatch[1];
        else
            return JSON.stringify(value);
    } else if (type === 'function')
        return 'Function';
    else
        return value;
};
