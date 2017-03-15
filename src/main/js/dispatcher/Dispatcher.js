var Events = require("ampersand-events");

var Dispatcher = {};

Events.createEmitter(Dispatcher);

module.exports = Dispatcher;
