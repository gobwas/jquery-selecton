var $ = require("jquery"),
    Unit;

Unit = function(id, data) {
    this.id = id;
    $.extend(this, data);
};

Unit.prototype = {
    constructor: Unit
};

module.exports = Unit;