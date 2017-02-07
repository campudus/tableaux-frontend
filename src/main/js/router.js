var App = require('ampersand-app');
var Router = require('ampersand-router');
var React = require('react');
var ReactDOM = require('react-dom');
var locale = require('browser-locale')();
import Tableaux from "./components/Tableaux.jsx";
var Dispatcher = require('./dispatcher/Dispatcher');
var TableauxConstants = require('./constants/TableauxConstants');
var ActionTypes = TableauxConstants.ActionTypes;
var ActionCreator = require('./actions/ActionCreator');

export let currentLangtag = null;

var TableauxRouter = Router.extend({
  routes : {
    '' : 'noTableAndLangtag',
    ':langtag(/)' : 'noTableAndLangtag',
    'tables(/)' : 'noTableAndLangtag',
    ':langtag/tables(/)' : 'noTable',

    ':langtag/tables/:tableid(/columns/:columnid/rows/:rowid)(?:filterString)' : 'tableBrowser',

    ':langtag/media(/)' : 'mediaBrowser',
    ':langtag/media/:folderid' : 'mediaBrowser',
    '(:langtag/)table(/)(*rest)' : 'redirectToNewUrl',
  },

  alreadyRendered : false,

  redirectToNewUrl: function (langtag = null, rest = null) {
    const prefix = (langtag) ? `${langtag}/` : "";
    const suffix = (rest) ? rest : "";
    return this.redirectTo(`${prefix}tables/${suffix}`)
  },

  renderOrSwitchView : function (viewName, params) {
    if (this.alreadyRendered) {
      ActionCreator.switchView(viewName, params);
    } else {
      this.alreadyRendered = true;
      ReactDOM.render(
        <Tableaux initialViewName={viewName}
                  initialParams={params}/>, document.getElementById('tableaux')
      );
    }
  },

  initialize : function (options) {
    console.log("init router");
    Dispatcher.on(ActionTypes.SWITCH_TABLE, this.switchTableHandler);
    Dispatcher.on(ActionTypes.SWITCH_FOLDER, this.switchFolderHandler);
    Dispatcher.on(ActionTypes.SWITCH_LANGUAGE, this.switchLanguageHandler, this);
  },

  switchLanguageHandler : function (newLangtagObj) {
    var his = this.history;
    var path = his.getPath();
    var newPath = path.replace(currentLangtag, newLangtagObj.langtag);

    his.navigate(newPath, {trigger : true});
  },

  switchTableHandler : function (payload) {
    var langtag = payload.langtag;
    App.router.history.navigate(langtag + '/tables/' + payload.id, {trigger : true});
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
    var langtag = TableauxConstants.DefaultLangtag;
    this.redirectTo(langtag + '/tables');
  },

  noTable : function (langtag) {
    console.log("TableauxRouter.noTable");
    currentLangtag = langtag;
    //TODO show error to user and refactor in function (DRY) see 'tableBrowser'
    if (typeof langtag === 'undefined' || TableauxConstants.Langtags.indexOf(langtag) === -1) {
      console.error("path param 'langtag' is not valid");
      return;
    }

    this.renderOrSwitchView(TableauxConstants.ViewNames.TABLE_VIEW, {
      tableId : null,
      langtag : langtag
    });
  },

  tableBrowser : function (langtag, tableid, columnid, rowid, filterString) {
    console.log("TableauxRouter.tableBrowser", langtag, tableid, columnid, rowid, (filterString) ? "rowFilter" : "");
    currentLangtag = langtag;
    //TODO show error to user
    if (typeof tableid === 'undefined' || isNaN(parseInt(tableid))) {
      console.error("path param 'tableid' is not valid");
      this.noTableAndLangtag();
      return;
    } else if (typeof langtag === 'undefined' || TableauxConstants.Langtags.indexOf(langtag) === -1) {
      console.error("path param 'langtag' is not valid");
      this.noTableAndLangtag();
      return;
    }

    var tableId = parseInt(tableid);

    this.renderOrSwitchView(TableauxConstants.ViewNames.TABLE_VIEW, {
      tableId : tableId,
      langtag : langtag,
      columnId: (columnid) ? parseInt(columnid) : null,
      rowId: (rowid) ? parseInt(rowid) : null,
      filter: (filterString) ? filterString : null
    });
  },

  mediaBrowser : function (langtag, folderid) {
    console.log("TableauxRouter.mediaBrowser", langtag, folderid);
    currentLangtag = langtag;
    //TODO show error to user
    if (typeof langtag === 'undefined' || TableauxConstants.Langtags.indexOf(langtag) === -1) {
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