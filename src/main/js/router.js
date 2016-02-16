var App = require('ampersand-app');
var Router = require('ampersand-router');
var React = require('react');
var ReactDOM = require('react-dom');
var locale = require('browser-locale')();

import Tableaux from './components/Tableaux.jsx';

var Dispatcher = require('./dispatcher/Dispatcher');
var TableauxConstants = require('./constants/TableauxConstants');
var ActionTypes = TableauxConstants.ActionTypes;
var ActionCreator = require('./actions/ActionCreator');

var TableauxRouter = Router.extend({
  routes : {
    '' : 'noTableAndLangtag',

    'table' : 'noTableAndLangtag',
    ':langtag/table' : 'noTable',

    ':langtag/table/:tableid' : 'tableBrowser',

    ':langtag/media' : 'mediaBrowser',
    ':langtag/media/:folderid' : 'mediaBrowser'
  },

  alreadyRendered : false,
  currentLangtag : null,

  renderOrSwitchView : function (viewName, params) {
    if (this.alreadyRendered) {
      ActionCreator.switchView(viewName, params);
    } else {
      this.alreadyRendered = true;
      ReactDOM.render(<Tableaux initialViewName={viewName}
                                initialParams={params}/>, document.getElementById('tableaux'));
    }
  },

  initialize : function (options) {
    Dispatcher.on(ActionTypes.SWITCH_TABLE, this.switchTableHandler);
    Dispatcher.on(ActionTypes.SWITCH_FOLDER, this.switchFolderHandler);
    Dispatcher.on(ActionTypes.SWITCH_LANGUAGE, this.switchLanguageHandler, this);
  },

  switchLanguageHandler : function (newLangtagObj) {
    var his = this.history;
    var path = his.getPath();
    var newPath = path.replace(this.currentLangtag, newLangtagObj.langtag);

    his.navigate(newPath, {trigger : true});
  },

  switchTableHandler : function (payload) {
    var langtag = payload.langtag;
    App.router.history.navigate(langtag + '/table/' + payload.id, {trigger : true});
  },

  switchFolderHandler : function (payload) {
    var langtag = payload.langtag;
    if (payload.id) {
      App.router.history.navigate(langtag + '/media/' + payload.id, {trigger : true});
    } else {
      App.router.history.navigate(langtag + '/media', {trigger : true});
    }
  },

  noTableAndLangtag : function () {
    console.log("TableauxRouter.noTableAndLangtag");
    var langtag = App.mapLocaleToLangtag(locale);
    this.redirectTo(langtag + '/table');
  },

  noTable : function (langtag) {
    console.log("TableauxRouter.noTable");
    this.currentLangtag = langtag;
    //TODO show error to user and refactor in function (DRY) see 'tableBrowser'
    if (typeof langtag === 'undefined' || App.langtags.indexOf(langtag) === -1) {
      console.error("path param 'langtag' is not valid");
      return;
    }

    this.renderOrSwitchView(TableauxConstants.ViewNames.TABLE_VIEW, {
      tableId : null,
      langtag : langtag
    });
  },

  tableBrowser : function (langtag, tableid) {
    console.log("TableauxRouter.tableBrowser", langtag, tableid);
    this.currentLangtag = langtag;
    //TODO show error to user
    if (typeof tableid === 'undefined' || isNaN(parseInt(tableid))) {
      console.error("path param 'tableid' is not valid");
      return;
    } else if (typeof langtag === 'undefined' || App.langtags.indexOf(langtag) === -1) {
      console.error("path param 'langtag' is not valid");
      return;
    }

    var tableId = parseInt(tableid);

    this.renderOrSwitchView(TableauxConstants.ViewNames.TABLE_VIEW, {
      tableId : tableId,
      langtag : langtag
    });
  },

  mediaBrowser : function (langtag, folderid) {
    console.log("TableauxRouter.mediaBrowser", langtag, folderid);
    this.currentLangtag = langtag;
    //TODO show error to user
    if (typeof langtag === 'undefined' || App.langtags.indexOf(langtag) === -1) {
      console.error("path param 'langtag' is not valid");
      return;
    }

    this.renderOrSwitchView(TableauxConstants.ViewNames.MEDIA_VIEW, {
      folderId : parseInt(folderid) || null,
      langtag : langtag
    });

  }
});

module.exports = TableauxRouter;