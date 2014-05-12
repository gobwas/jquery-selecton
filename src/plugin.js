var jquery   = require("jquery"),
    Selecton = require("./selecton"),

    _old;

// jQuery Plugin Initialization
// ----------------------------

_old = $.fn.selecton;

$.fn.selecton = function(options) {
    var args;

    args = Array.prototype.slice.call(arguments, 1);

    return this.map(function () {
        var selecton, method;

        if (isString(options)) {
            method = options;
            options = {};
        } else {
            options || (options = {});
        }

        selecton = $(this).data('selecton');

        if (!selecton) {
            selecton = new Selecton(this, options);
            selecton.initialize();
            $(this).data('selecton', selecton);
        }

        if (method && isFunction(selecton[method])) {
            return selecton[method].apply(selecton, args);
        }

        return selecton;
    });
};

$.extend($.fn.selecton, Selecton);

$.fn.selecton.noConflict = function() {
    $.fn.selecton = _old;
};

module.exports = Selecton;