import App from 'ampersand-app';
import Router from './router';
import Dispatcher from './dispatcher/Dispatcher';
import apiUrl from './helpers/apiUrl';
import multiLanguage from './helpers/multiLanguage';
import TableauxConstants from './constants/TableauxConstants';
import _ from 'lodash';

if (process.env.NODE_ENV != 'production') {
  window.Perf = require('react-addons-perf');
}

import '../index.html';
import '../scss/main.scss';

App.extend({

  //Deprecated! Use TableauxConstants.Langtags instead
  langtags : TableauxConstants.Langtags,

  init : function () {
    //Global tableaux variable. Used for some DOM References
    window.GLOBAL_TABLEAUX = {};
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
