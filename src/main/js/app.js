var App = require('ampersand-app');
var Router = require('./router');
var Dispatcher = require('./dispatcher/Dispatcher');
var apiUrl = require('./helpers/apiUrl');
var multiLanguage = require('./helpers/multiLanguage');
var TableauxConstants = require('./constants/TableauxConstants');
var _ = require('lodash');

App.extend({

  // TODO we should request that from tableaux backend
  langtags : []

  setLangtags : function () {
    var self = this;
    _.forEach(TableauxConstants.Langtags, function (lang) {
      self.langtags.push(lang);
    });
  },

  init : function () {
    this.setLangtags();
    this.router = new Router();
    this.router.history.start();
  },

  apiUrl : apiUrl,

  // TODO Remove this and replace all references with TableauxConstants
  defaultLangtag : TableauxConstants.DefaultLangtag,
  dateTimeFormats : TableauxConstants.DateTimeFormats,

  mapLocaleToLangtag : function (locale) {
    return multiLanguage.mapLocaleToLangtag(this.langtags)(locale)
  }
});

App.init();
