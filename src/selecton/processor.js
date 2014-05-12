var $     = require("jquery"),
    utils = require("./utils"),
    Unit  = require("./unit"),

    isObject   = utils.isObject,
    isString   = utils.isString,
    isFunction = utils.isFunction,
    isArray    = utils.isArray,

    AbstractProcessor;

AbstractProcessor = function(options) {
    options = options || {};

    this.options = $.extend(true, {}, AbstractProcessor.DEFAULTS, options);

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

AbstractProcessor.prototype = {
    constructor: AbstractProcessor,

    events: {
        'click': {
            button:  'onButtonClick',
            tumbler: 'onToggleClick'
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

    initialize: function(target) {
        this.target  = $(target);
        this.list    = this._createElement(this.options.view.list);
        this.content = this._createElement(this.options.view.content);

        this.content.append(this.list);
    },

    unit: function(data, id) {
        var unit, $item, $button;

        unit = new Unit(id, data);

        if (this.filter(unit)) {
            this.units.push(unit);

            this.items[id]   = $item   = this._createElement(this.options.view.item,   data);
            this.buttons[id] = $button = this._createElement(this.options.view.button, data);

            $item.data  (self.options.storageKey, { id: id });
            $button.data(self.options.storageKey, { id: id });

            return unit;
        } else {
            return null;
        }
    },

    findUnit: function(id) {
        var unit, x;

        for (x = 0; x < this.units.length; x++) {
            unit = this.units[x];

            if (unit.id === id) {
                return unit;
            }
        }

        return null;
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
            self.$list.append($item);
        });

        this.content.insertAfter(this.target);

        this.delegateEvents();
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

    delegateEvents: function() {
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

    tumbler: function($el, options) {
        return $el;
    },

    toggle: function() {
        return true;
    },

    bind: function(fn) {
        this.selecton = fn;
    },

    notify: function(id) {
        this.selecton(id);
    },

    select: function(id) {
        var className;

        try {
            className = this.options.item.classes.selected;
        } catch (err) {
            // Could not find classes definition
        }

        if (className) {
            if (this.selected !== null) {
                this._switchClass(this.items[this.selected], className, false);
            }

            this._switchClass(this.items[id], className, true);
        }

        this.selected = id;
        this.notify(id);
    },

    filter: function(unit) {
        if (!(unit instanceof Unit)) {
            throw new TypeError("Unit is expected");
        }

        return !unit.input.data("skip");
    },

    comparator: function(unit, index) {
        return index;
    },

    iterator: function(unit) {
        //
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

    setHandler: function(event, handler) {
        if (this.handlers[event]) {
            this.handlers[event] = handler;
        }
    },

    destroy: function() {
        //
    }
};

AbstractProcessor.DEFAULTS = {
    storageKey:      "selecton-storage",
    event_namespace: "selecton",
    view: {
        content: {
            tagName:   "div",
            className: "selecton-processor",
            onData: {
                attributes: [],
                properties: [],
                html:       null,
                classes:    null
            }
        },
        list: {
            tagName:   "ul",
            className: "properties",
            onData: {
                attributes: ["class"],
                properties: [],
                content:    null,
                classes:    null
            }
        },
        item: {
            tagName:   "li",
            className: "properties-item",
            onData: {
                attributes: ["class"],
                properties: [],
                content:    null,
                classes: {
                    "selected": "is--active"
                }
            }
        },
        button: {
            tagName:    "a",
            className:  "properties-link",
            onData: {
                attributes: ["title"],
                properties: [],
                content:    "title",
                classes: {
                    "selected": "is--active"
                }
            }
        }
    }
};

module.exports = AbstractProcessor;
