var $          = require("jquery"),
    utils      = require("../utils"),
    isFunction = utils.isFunction,
    Processor  = require("../processor");

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