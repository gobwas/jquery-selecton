var $                 = require("jquery"),
    Selecton          = require("./selecton"),
    Processor         = require("./selecton/processor"),
    DropdownProcessor = require("./selecton/processor/dropdown"),
    ButtonsProcessor  = require("./selecton/processor/buttons"),
    utils             = require("./selecton/utils"),

    isFunction = utils.isFunction,
    isString   = utils.isString,

    _old;

// jQuery Plugin Initialization
// ----------------------------

_old = $.fn.selecton;

$.fn.selecton = function(options) {
    var args;

    args = Array.prototype.slice.call(arguments, 1);

    return this.map(function () {
        var selecton, method, Processor;

        if (isString(options)) {
            method = options;
            options = {};
        } else {
            options || (options = {});
        }

        if (isString(options.processor) && isFunction(Processor = $.fn.selecton.processors[options.processor])) {
            options.processor = new Processor();
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

$.fn.selecton.processor = Processor;
$.fn.selecton.processors = {
    button:   ButtonsProcessor,
    dropdown: DropdownProcessor
};

$.fn.selecton.noConflict = function() {
    $.fn.selecton = _old;
};