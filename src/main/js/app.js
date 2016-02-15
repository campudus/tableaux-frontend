import App from 'ampersand-app';
import Router from './router';
import Dispatcher from './dispatcher/Dispatcher';
import apiUrl from './helpers/apiUrl';
import multiLanguage from './helpers/multiLanguage';
import TableauxConstants from './constants/TableauxConstants';
import _ from 'lodash';

import '../index.html';
import '../scss/main.scss';

App.extend({

  // TODO we should request that from tableaux backend
  langtags : [],

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
