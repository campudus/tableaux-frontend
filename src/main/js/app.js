var App = require('ampersand-app');
var Registry = require('ampersand-registry');

var Router = require('./router');
var Dispatcher = require('./dispatcher/Dispatcher');
var apiUrl = require('./helpers/apiUrl');
var multiLanguage = require('./helpers/multiLanguage');

App.extend({
  init : function () {
    this.router = new Router();
    this.router.history.start();

    this.Registry = new Registry();
  },

  registerModel : function (model) {
    var Registry = this.Registry;
    Registry.store(model);

    model.on('destroy', function () {
      Registry.remove(model.getType(), model.getId());
    }, model);
  },

  on : Dispatcher.on.bind(Dispatcher),
  off : Dispatcher.off.bind(Dispatcher),
  trigger : Dispatcher.trigger.bind(Dispatcher),

  apiUrl : apiUrl,
  Dispatcher : Dispatcher,

  // TODO we should request that from tableaux backend
  langtags : [
    "de-DE",
    "en-GB",
    "fr-FR"
  ],

  mapLocaleToLangtag : function (locale) {
    return multiLanguage.mapLocaleToLangtag(this.langtags)(locale)
  }
});

App.init();