var utils      = require("./selecton/utils"),
    $          = require("jquery"),
    Processor  = require("./processor"),
    Unit       = require("./unit"),

    isFunction = utils.isFunction,
    isObject   = utils.isObject,
    isString   = utils.isString,

    Selecton;


Selecton = function(element, processor, options) {
    options = options || {};

    if (!(processor instanceof Processor)) {
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

                self.inputs[id] = $input;

                data = {};
                $.each(source.data, function(key, config) {
                    data[key] = $(input)[config.selector](config.key);
                });

                if (unit = processor.unit(data, id)) {
                    self.units[id] = unit;
                }
            });

            // when target is destroyed
            this.$target.on("destroy", $.proxy(self.destroy, self));

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
            selected: {
                selector: "prop",
                key:      "selected"
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