var App = require('ampersand-app');
var Router = require('ampersand-router');
var React = require('react');
var ReactDOM = require('react-dom');
var locale = require('browser-locale')();

var Folder = require('./models/media/Folder');
var Tables = require('./models/Tables');

var FolderView = require('./components/media/folder/Folder.jsx');
var Tableaux = require('./components/Tableaux.jsx');

var Dispatcher = require('./dispatcher/Dispatcher');
var ActionTypes = require('./constants/TableauxConstants').ActionTypes;
var ActionCreator = require('./actions/ActionCreator');

var TableauxRouter = Router.extend({
  routes : {
    '' : 'home',

    'table' : 'noTable',
    ':langtag/table' : 'noTable',

    ':langtag/table/:tableid' : 'tableBrowser',

    ':langtag/media' : 'mediaBrowser',
    ':langtag/media/:folderid' : 'mediaBrowser'
  },

  initialize : function (options) {
    Dispatcher.on(ActionTypes.SWITCH_TABLE, this.switchTableHandler);
    //TODO Switch language
  },

  switchTableHandler : function (payload) {
    var langtag = payload.langtag;
    App.router.history.navigate(langtag + '/table/' + payload.id, {trigger : true});
  },

  home : function () {
    this.redirectTo('table');
  },

  noTable : function (langtag) {
    console.log("TableauxRouter.noTable");

    var self = this;

    if (!langtag) {
      langtag = App.mapLocaleToLangtag(locale);
    }

    this.tables = new Tables();
    this.tables.fetch({
      success : function (collection) {
        if (typeof collection.at(0) !== 'undefined') {
          self.redirectTo(langtag + '/table/' + collection.at(0).getId());
        }
      }
    });
  },

  tableBrowser : function (langtag, tableid) {
    console.log("TableauxRouter.tableBrowser", langtag, tableid);

    if (typeof tableid === 'undefined' || isNaN(parseInt(tableid))) {
      console.error("path param 'tableid' is not valid");
      return;
    } else if (typeof langtag === 'undefined' || App.langtags.indexOf(langtag) === -1) {
      console.error("path param 'langtag' is not valid");
      return;
    }

    var self = this;

    var tableId = parseInt(tableid);

    // router is called even if we switch through
    // tables with TableSwitcher but we only want to
    // re-render the page if we are called with a
    // different langtag.
    // TODO perhaps we should do that with a setState
    if (this.alreadyCalled && this.alreadyCalled.langtag === langtag) {
      // Tableaux.jsx is listening on this
      // state will be changed which triggers
      // a React render
      //Dispatcher.trigger(ActionTypes., {id : id});
      ActionCreator.switchedTable(tableId);

    } else {
      this.alreadyCalled = {
        langtag : langtag
      };

      // we could be called by route noTable
      // in this case `this.tables` is already
      // defined and fetched
      if (!this.tables) {
        this.tables = new Tables();
        this.tables.fetch({
          success : function () {
            self.renderPage(<Tableaux tables={self.tables} initialTableId={tableId} langtag={langtag}/>);
          }
        });
      } else {
        self.renderPage(<Tableaux tables={self.tables} initialTableId={tableId} langtag={langtag}/>);
      }
    }
  },

  mediaBrowser : function (langtag, folderid) {
    console.log("TableauxRouter.mediaBrowser", langtag, folderid);

    if (typeof langtag === 'undefined' || App.langtags.indexOf(langtag) === -1) {
      console.error("path param 'langtag' is not valid");
      return;
    }

    var self = this;

    if (typeof folderid === 'undefined') {
      this.folder = new Folder({id : null});
    } else {
      this.folder = new Folder({id : parseInt(folderid)});
    }

    this.folder.fetch({
      data: { langtag: langtag },
      success : function () {
        self.renderPage(<FolderView folder={self.folder} langtag={langtag}/>);
      }
    });
  },

  renderPage : function (page) {
    ReactDOM.render(page, document.getElementById('tableaux'));
  }
});

module.exports = TableauxRouter;