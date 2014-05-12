var $ = require("jquery"),
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