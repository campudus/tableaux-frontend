var App = require('ampersand-app');
var Registry = require('ampersand-registry');

var Router = require('./router');
var Dispatcher = require('./dispatcher/Dispatcher');
var apiUrl = require('./helpers/apiUrl');

App.extend({
  init : function () {
    this.router = new Router();
    this.router.history.start();

    this.Registry = new Registry();
  },

  registerModel : function (model) {
    console.log("App.registerModel", model.getType(), model.getId());

    var Registry = this.Registry;
    Registry.store(model);

    model.on('destroy', function () {
      Registry.remove(model.getType(), model.getId());
    }, model);
  },

  on : Dispatcher.on,
  off : Dispatcher.off,

  apiUrl : apiUrl,
  Dispatcher : Dispatcher
});

App.init();