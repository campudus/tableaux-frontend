var App = require('ampersand-app');
var Router = require('./router');
var Dispatcher = require('./dispatcher/Dispatcher');
var apiUrl = require('./helpers/apiUrl');
var multiLanguage = require('./helpers/multiLanguage');

App.extend({
  init : function () {
    this.router = new Router();
    this.router.history.start();
  },

  apiUrl : apiUrl,

  // TODO we should request that from tableaux backend
  langtags : [
    "de-DE",
    "en-GB",
    "fr-FR"
  ],

  defaultLangtag : "de-DE",

  dateTimeFormats : {
    formatForServer : "YYYY-MM-DDTHH:mm:SS.SSSZ",
    formatForUser : "DD.MM.YYYY - HH:mm",
  },

  mapLocaleToLangtag : function (locale) {
    return multiLanguage.mapLocaleToLangtag(this.langtags)(locale)
  }
});

App.init();