var isFunction, isObject, isString, isArray;

isFunction = function(obj) {
    return Object.prototype.toString.call(obj) == '[object Function]';
};

isObject = function(obj) {
    return obj != void 0 && Object.prototype.toString.call(obj) == '[object Object]';
};

isString = function(obj) {
    return Object.prototype.toString.call(obj) == '[object String]';
};

isArray = function(obj) {
    return Object.prototype.toString.call(obj) == '[object Array]';
};

module.exports.isFunction = isFunction;
module.exports.isObject   = isObject;
module.exports.isString   = isString;
module.exports.isArray    = isArray;