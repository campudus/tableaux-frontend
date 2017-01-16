import App from 'ampersand-app';
import Router from './router';
import TableauxConstants from './constants/TableauxConstants';
import {getAllLangtagsFromServer} from './helpers/serverSettingsHelper';
import {initDevelopmentAccessCookies} from './helpers/accessManagementHelper';
import '../index.html';
import '../scss/main.scss';

if (process.env.NODE_ENV != 'production') {
  window.Perf = require('react-addons-perf');
}

App.extend({

  init : function () {

    //gets called just in development
    initDevelopmentAccessCookies();

    //Global tableaux variable. Used for some DOM References
    window.GLOBAL_TABLEAUX = {};

    //init all available langtags from server before continuing
    getAllLangtagsFromServer((err) => {
      console.warn("error:", err);
    }, (languages) => {
      TableauxConstants.initLangtags(languages);
      this.router = new Router();
      this.router.history.start();
    });
  }

});

App.init();
