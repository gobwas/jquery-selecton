/**
 * jquery-selecton - jquery plugin that converts select elements.
 *
 * Version: 0.1.1
 * Date: 2014-06-26 14:45:14
 *
 * Copyright 2014, Sergey Kamardin <gobwas@gmail.com>.
 *
 * Licensed under the MIT license.
 * http://www.opensource.org/licenses/mit-license.php
 *
 * Repository: https://github.com/gobwas/jquery-selecton.git
 * Location: Moscow, Russia.
 */


 (function(root, factory) {
    var isAMD, isCJS,
        jQuery;

    isCJS = typeof module === "object"   && module.exports;
    isAMD = typeof define === "function" && define.amd;

    if (isCJS) {
        jQuery = require("jQuery");
        module.exports = factory(jQuery);
    } else if (isAMD) {
        define(["jquery"], function(jQuery) {
            return factory(jQuery);
        });
    } else {
        jQuery = root.jQuery;
        return factory(jQuery);
    }

})(this, function(jQuery) {
    !function(e){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=e();else if("function"==typeof define&&define.amd)define([],e);else{var o;"undefined"!=typeof window?o=window:"undefined"!=typeof global?o=global:"undefined"!=typeof self&&(o=self),o.noscope=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(_dereq_,module,exports){
(function (global){
var $                 = (typeof window !== "undefined" ? jQuery : typeof global !== "undefined" ? global.jQuery : null),
    Selecton          = _dereq_("./selecton"),
    Processor         = _dereq_("./selecton/processor"),
    DropdownProcessor = _dereq_("./selecton/processor/dropdown"),
    ButtonsProcessor  = _dereq_("./selecton/processor/buttons"),
    utils             = _dereq_("./selecton/utils"),

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
}).call(this,typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./selecton":2,"./selecton/processor":4,"./selecton/processor/buttons":5,"./selecton/processor/dropdown":6,"./selecton/utils":8}],2:[function(_dereq_,module,exports){
(function (global){
var $         = (typeof window !== "undefined" ? jQuery : typeof global !== "undefined" ? global.jQuery : null),
    Processor = _dereq_("./selecton/processor"),

    Selecton;

Selecton = function(element, options) {
    var processor;

    options = options || {};

    if (!((processor = options.processor) instanceof Processor)) {
        throw new TypeError("Processor is expected");
    }

    this.target  = element;
    this.$target = $(element);

    this.processor = processor;

    this.options = $.extend(true, {}, Selecton.DEFAULTS, options);

    this.units = [];
};

Selecton.prototype = (function() {
    var hideSource;

    hideSource = function($source) {
        var id;

        $source.hide();
        (id = $source.attr('id')) && $source.parent().find('label[for="' + id + '"]').hide();
    };

    return {
        constructor: Selecton,

        initialize: function() {
            var source, self, selector, processor;

            self = this;
            processor = this.processor;

            processor.bind($.proxy(this.select, this));

            source = this.options.source;

            this.selected = null;

            // option tags
            this.inputs  = [];

            this.data    = [];

            this.items   = [];
            this.buttons = [];

            processor.initialize(this.target);

            selector = [];
            source.tagName  && (selector.push(source.tagName));
            source.selector && (selector.push(source.selector));
            selector = selector.join('');

            this.$target.find(selector).each(function(id, input) {
                var $input, data, unit;

                $input = $(input);
                $input.data(self.options.storageKey, { id: id });

                self.inputs[id] = $input;

                data = {};
                $.each(source.data, function(key, config) {
                    var getter, argument;

                    getter = $input[config.selector];

                    if (argument = config.key) {
                        data[key] = getter.call($input, argument);
                    } else {
                        data[key] = getter.call($input);
                    }
                });

                if (unit = processor.unit(data, id)) {
                    self.units[id] = unit;
                }
            });

            // when target is destroyed
            this.$target.on("destroy", $.proxy(self.destroy, self));

            // this.$target.on("change", $.proxy(self.onChange, self));

            processor.finalize();

            hideSource(this.$target);
        },

        destroy: function() {
            this.processor.destroy();
        },

        select: function(id) {
            var self = this,
                source;

            source = this.options.source;

            if (self.selected !== null) {
                self.inputs[self.selected][source.data.selected.selector](source.data.selected.key, false);
            }

            self.inputs[id][source.data.selected.selector](source.data.selected.key, true);

            if (self.selected !== id) {
                self.$target.trigger('change');
                self.selected = id;
            }
        }
    }
})();

Selecton.DEFAULTS = {
    storageKey: "selecton-storage",
    source: {
        tagName: "option",
        selector: null,
        data: {
            value: {
                selector: "attr",
                key:      "value"
            },
            title: {
                selector: "attr",
                key:      "title"
            },
            content: {
                selector: "text"
            },
            selected: {
                selector: "prop",
                key:      "selected"
            },
            disabled: {
                selector: "prop",
                key:      "disabled"
            },
            "class": {
                selector: "attr",
                key:      "class"
            },
            skip: {
                selector: "data",
                key:      "selecton-skip"
            }
        }
    }
};

// register removal event
if (!$.event.special.destroy) {
    $.event.special.destroy = {
        remove: function(o) {
            if (o.handler) {
                o.handler()
            }
        }
    };
}


module.exports = Selecton;
}).call(this,typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./selecton/processor":4}],3:[function(_dereq_,module,exports){
var each = function(props, func, context) {
    var result;

    context || (context = null);

    for (var x in props) {
        if (props.hasOwnProperty(x)) {
            result = func.call(context, props[x], x, props);

            if (result !== undefined) {
                return result;
            }
        }
    }

    return result;
};

/**
 * Extends one object by multiple others.
 *
 * @param {object} to
 *
 * @returns {object}
 */
var extend = function(to) {
    var from = Array.prototype.slice.call(arguments, 1);

    var func = function(value, prop) {
        to[prop] = value;
    };

    for (var x = 0; x < from.length; x++) {
        each(from[x], func);
    }

    return to;
};

/**
 * Inheritance function.
 *
 * @param {function} Parent
 * @param {object} [protoProps]
 * @param {object} [staticProps]
 *
 * @returns {function}
 */
var inherits = function(Parent, protoProps, staticProps) {
    var Child;

    protoProps || (protoProps = {});
    staticProps || (staticProps = {});

    if (protoProps.hasOwnProperty("constructor") && typeof protoProps.constructor === 'function') {
        Child = protoProps.constructor;
    } else {
        Child = function Child(){Parent.apply(this, arguments);};
    }

    // set the static props to the new Enum
    extend(Child, Parent, staticProps);

    // create prototype of Child, that created with Parent prototype
    // (without making Child.prototype = new Parent())
    //
    // __proto__  <----  __proto__
    //     ^                 ^
    //     |                 |
    //   Parent            Child
    //
    function Surrogate(){}
    Surrogate.prototype = Parent.prototype;
    Child.prototype = new Surrogate();

    // extend prototype
    extend(Child.prototype, protoProps, {constructor: Child});

    // link to Parent prototype
    Child.__super__ = Parent.prototype;

    return Child;
};

module.exports = inherits;
},{}],4:[function(_dereq_,module,exports){
(function (global){
var $        = (typeof window !== "undefined" ? jQuery : typeof global !== "undefined" ? global.jQuery : null),
    utils    = _dereq_("./utils"),
    inherits = _dereq_("./inherits"),
    Unit     = _dereq_("./unit"),

    isObject   = utils.isObject,
    isString   = utils.isString,
    isFunction = utils.isFunction,
    isArray    = utils.isArray,

    Processor;

Processor = function(options) {
    options = options || {};

    this.options = $.extend(true, {}, this.constructor.DEFAULTS, options);

    this.handlers = {};

    this.selecton = null;

    this.target   = null;

    this.content  = null;
    this.list     = null;

    this.units    = [];

    this.items    = {};
    this.buttons  = {};

    this.selected = null;
};

Processor.prototype = {
    constructor: Processor,

    events: {
        'click': {
            button:  'onButtonClick'
        }
    },

    _switchClass: function($element, className, force) {
        if (isString(className)) {
            $element.toggleClass(className, !!force);
        } else if (isArray(className)) {
            $element.addClass(className[+!!force]);
            $element.removeClass(className[+!force]);
        }
    },

    _createElement: (function() {
        var tag = function(tag) {
            return ['<', tag, '/>'].join('');
        };

        return function(options, data) {
            var self = this,
                $element, className, onData;

            $element = $(tag(options.tagName)).addClass(options.className);

            if (isObject(data) && isObject(onData = options.onData)) {
                $.each(data, function(key, value) {
                    if (onData.attributes && onData.attributes.indexOf(key) !== -1) {
                        $element.attr(key, value);
                    }

                    if (onData.properties && onData.properties.indexOf(key) !== -1) {
                        $element.prop(key, value);
                    }

                    if (onData.classes && (className = onData.classes[key])) {
                        self._switchClass($element, className, value);
                    }

                    if (onData.content && onData.content === key) {
                        $element.text(value);
                    }
                });
            }

            return $element;
        }
    })(),

    _delegateEvents: function() {
        var self = this;

        $.each(this.events, function(event, elements) {
            $.each(elements, function(element, fnName) {
                var config;
                if (config = self.options.view[element]) {
                    self.content.on([event, self.options.event_namespace].join('.'), [config.tagName, config.className.split(' ').join('.')].join('.'), $.proxy(self[fnName], self));
                }
            });
        });
    },

    initialize: function(target) {
        this.target  = $(target);

        this.list    = this.createList();
        this.content = this.createContent();

        this.content.append(this.list);

        this.target.on("change", $.proxy(this.onChange, this));
    },

    finalize: function() {
        var self = this;

        // apply abstract iterator
        $.each(this.units, function(index, unit) {
            self.iterator(unit);
        });

        // sort the units
        this.sort();

        // append items
        $.each(this.units, function(index, unit) {
            var $item, $button;

            $item   = self.items  [unit.id];
            $button = self.buttons[unit.id];

            $item.append($button);
            self.list.append($item);
        });

        this.content.insertAfter(this.target);

        this._delegateEvents();
    },

    createList: function() {
        return this._createElement(this.options.view.list);
    },

    createContent: function() {
        return this._createElement(this.options.view.content);
    },

    createItem: function(data) {
        return this._createElement(this.options.view.item, data);
    },

    createButton: function(data) {
        return this._createElement(this.options.view.button, data);
    },

    unit: function(data, id) {
        var self = this,
            unit, $item, $button;

        unit = new Unit(id, data);

        if (this.filter(unit)) {
            this.units.push(unit);

            this.items[id]   = $item   = this.createItem(data);
            this.buttons[id] = $button = this.createButton(data);

            $item.data  (self.options.storageKey, { id: id });
            $button.data(self.options.storageKey, { id: id });

            if (unit.data.selected) {
                this.selected = id;
            }

            return unit;
        } else {
            return null;
        }
    },

    findUnit: function(criteria) {
        var unit, x;

        if (!isObject(criteria)) {
            criteria = {
                id: criteria
            };
        }

        for (x = 0; x < this.units.length; x++) {
            unit = this.units[x];

            if (criteria.id != void 0 && unit.id === criteria.id) {
                return unit;
            }

            if (criteria.value != void 0 && unit.data.value === criteria.value) {
                return unit;
            }
        }

        return null;
    },

    sort: function() {
        var self = this,
            sorted;

        // sort the inputs
        sorted = $.map(this.units, function(unit, index) {
            var criteria;

            criteria = self.comparator(unit, index);

            return {
                index:    index,
                criteria: criteria,
                unit:     unit
            };
        });

        sorted.sort(function(left, right) {
            var a = left.criteria;
            var b = right.criteria;
            if (a !== b) {
                if (a > b || a === void 0) return 1;
                if (a < b || b === void 0) return -1;
            }
            return left.index < right.index ? -1 : 1;
        });

        return this.units = $.map(sorted, function(obj) {
            return obj.unit;
        });
    },

    filter: function(unit) {
        if (!(unit instanceof Unit)) {
            throw new TypeError("Unit is expected");
        }

        return !unit.data.skip;
    },

    bind: function(fn) {
        this.selecton = fn;
    },

    notify: function(id) {
        this.selecton(id);
    },

    select: function(id) {
        var className;

        if (this.selected === id) {
            return;
        }

        // Switch item classes
        try {
            className = this.options.view.item.onData.classes.selected;
        } catch (err) {
            // Could not find classes definition
        }

        if (className) {
            if (this.selected !== null) {
                this._switchClass(this.items[this.selected], className, false);
            }

            this._switchClass(this.items[id], className, true);
        }

        // Switch button classes
        try {
            className = this.options.view.button.onData.classes.selected;
        } catch (err) {
            // Could not find classes definition
        }

        if (className) {
            if (this.selected !== null) {
                this._switchClass(this.buttons[this.selected], className, false);
            }

            this._switchClass(this.buttons[id], className, true);
        }

        this.selected = id;
        this.notify(id);
    },

    setHandler: function(event, handler) {
        if (this.handlers[event]) {
            this.handlers[event] = handler;
        }
    },

    onChange: function() {
        var unit;

        if (unit = this.findUnit({value: this.target.val()})) {
            this.select(unit.id);
        }
    },

    onButtonClick: function(event) {
        var self = this,
            $target, data, id, unit, handler;

        $target = $(event.currentTarget);
        data = $target.data(this.options.storageKey);
        id   = data.id;

        handler = this.handlers['click'];

        if (!(unit = this.findUnit(id))) {
            return;
        }

        if (isFunction(handler)) {
            $.when(handler.call(null, event, unit))
                .then(function() {
                    self.select(id);
                });
        } else {
            this.select(id);
        }
    },

    find: function(type, filter) {
        var self = this,
            filtered = [];

        if (type == 'button') {
            $.each(this.units, function(index, unit) {
                filter.call(null, unit) && filtered.push(unit);
            });

            filtered = $.map(filtered, function(unit) {
                return {
                    button: self.buttons[unit.id],
                    item:   self.items  [unit.id]
                }
            });
        }

        return filtered;
    },

    comparator: function(unit, index) {
        //
    },

    iterator: function(unit) {
        //
    },

    destroy: function() {
        //
    }
};

Processor.DEFAULTS = {
    storageKey:      "selecton-storage",
    event_namespace: "selecton",
    view: {
        content: {
            tagName:   "div",
            className: "selecton",
            onData: {
                attributes: [],
                properties: [],
                html:       null,
                classes:    null
            }
        },
        list: {
            tagName:   "ul",
            className: "selecton-options",
            onData: {
                attributes: ["class"],
                properties: [],
                content:    null,
                classes:    null
            }
        },
        item: {
            tagName:   "li",
            className: "selecton-option",
            onData: {
                attributes: ["class"],
                properties: [],
                content:    null,
                classes: {
                    "selected": "is--active",
                    "disabled": "is--disabled"
                }
            }
        },
        button: {
            tagName:    "button",
            className:  "selecton-button",
            onData: {
                attributes: ["title"],
                properties: ["disabled"],
                content:    "content",
                classes: {
                    "selected": "is--active",
                    "disabled": "is--disabled"
                }
            }
        }
    }
};

Processor.extend = function(protoProps, staticProps) {
    return inherits(this, protoProps, staticProps);
};


module.exports = Processor;


}).call(this,typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./inherits":3,"./unit":7,"./utils":8}],5:[function(_dereq_,module,exports){
var Processor = _dereq_("../processor");

module.exports = Processor.extend({

});
},{"../processor":4}],6:[function(_dereq_,module,exports){
(function (global){
var $          = (typeof window !== "undefined" ? jQuery : typeof global !== "undefined" ? global.jQuery : null),
    utils      = _dereq_("../utils"),
    isFunction = utils.isFunction,
    Processor  = _dereq_("../processor");

module.exports = Processor.extend({
    events: $.extend(true, {
        click: {
            tumbler: 'onToggleClick'
        }
    }, Processor.prototype.events),

    constructor: function() {
        Processor.prototype.constructor.apply(this, arguments);
        this.visibile = null;
        this.eventNamespace = null;
    },

    initialize: function() {
        Processor.prototype.initialize.apply(this, arguments);

        this.eventNamespace = ["selecton-dropdown", new Date().getTime(), Math.floor(Math.random() * 10000)].join("-");

        this.tumbler = this.createTumbler();
        this.content.prepend(this.tumbler);
    },

    finalize: function() {
        Processor.prototype.finalize.apply(this, arguments);
        this.refreshTumblerCaption();
        this.toggle(false);
    },

    createTumbler: function() {
        return this._createElement(this.options.view.tumbler);
    },

    refreshTumblerCaption: function() {
        var id, unit;

        if (null !== (id = this.selected) && (unit = this.findUnit(id))) {
            this.tumbler.text(unit.data.content);
        }
    },

    onToggleClick: function(event) {
        var self = this,
            handler;

        handler = this.handlers['toggle'];

        if (isFunction(handler)) {
            $.when(handler.call(null, event))
                .then(function() {
                    self.toggle()
                });
        } else {
            this.toggle();
        }
    },

    _toggleEvent: (function() {
        var cache;

        return function() {
            return cache || (cache = ['click', this.eventNamespace].join('.'));
        }
    })(),

    _hide: function() {
        var self   = this,
            className;

        try {
            className = this.options.view.tumbler.onData.classes.toggle;
        } catch (err) {
            // Could not find classes definition
        }

        if (className) {
            this._switchClass(this.tumbler, className, false);
        }

        return $.when(this.animateListOut()).then(function(){
            return self.visible = false;
        });
    },

    _show: function() {
        var self   = this,
            className;

        try {
            className = this.options.view.tumbler.onData.classes.toggle;
        } catch (err) {
            // Could not find classes definition
        }

        if (className) {
            this._switchClass(this.tumbler, className, true);
        }

        return $.when(this.animateListIn()).then(function() {
            setTimeout(function() {
                $(document).on(self._toggleEvent(), function(event) {
                    if($(event.target).parents().index(self.list) == -1) {
                        self._hide();
                        $(document).off(self._toggleEvent());
                    }
                });
            }, 0);

            return self.visible = true;
        })
    },

    animateListIn: function() {
        return this.list.show();
    },

    animateListOut: function() {
        return this.list.hide();
    },

    select: function(id) {
        Processor.prototype.select.apply(this, arguments);

        $(document).off(this._toggleEvent());

        this.refreshTumblerCaption();
        if (this.visible === true) this.toggle();
    },

    toggle: function(force) {
        var toggle;

        toggle = force == void 0 ? !this.visible : force;

        return toggle ? this._show() : this._hide();
    }

}, $.extend(true, {
    DEFAULTS: {
        view: {
            tumbler: {
                tagName:   "button",
                className: "selecton-tumbler",
                onData: {
                    classes: {
                        "toggle": "is--active"
                    }
                }
            }
        }
    }
}, Processor));
}).call(this,typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"../processor":4,"../utils":8}],7:[function(_dereq_,module,exports){
(function (global){
var $ = (typeof window !== "undefined" ? jQuery : typeof global !== "undefined" ? global.jQuery : null),
    Unit;

Unit = function(id, data) {
    this.id = id;
    this.data = {};
    $.extend(this.data, data);
};

Unit.prototype = {
    constructor: Unit
};

module.exports = Unit;
}).call(this,typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],8:[function(_dereq_,module,exports){
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
},{}]},{},[1])
(1)
});
});