var App = require('ampersand-app');
var Router = require('ampersand-router');
var React = require('react');
var locale = require('browser-locale')();

var Folder = require('./models/media/Folder');
var Tables = require('./models/Tables');

var FolderView = require('./components/media/Folder.jsx');
var Tableaux = require('./components/Tableaux.jsx');

var Dispatcher = require('./dispatcher/Dispatcher');

var TableauxRouter = Router.extend({
  routes : {
    '' : 'home',

    'table' : 'noTable',
    ':langtag/table' : 'noTable',

    ':langtag/table/:tableid' : 'tableBrowser',

    ':langtag/media' : 'mediaBrowser',
    ':langtag/media/:folderid' : 'mediaBrowser'
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

    var id = parseInt(tableid);

    // router is called even if we switch through
    // tables with TableSwitcher but we only want to
    // re-render the page if we are called with a
    // different langtag.
    // TODO perhaps we should do that with a setState
    if (this.alreadyCalled && this.alreadyCalled.langtag === langtag) {
      // Tableaux.jsx is listening on this
      // state will be changed which triggers
      // a React render
      Dispatcher.trigger('switch-table', {id : id});
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
            self.renderPage(<Tableaux tables={self.tables} initialTableId={id} langtag={langtag}/>);
          }
        });
      } else {
        self.renderPage(<Tableaux tables={self.tables} initialTableId={id} langtag={langtag}/>);
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
      success : function () {
        self.renderPage(<FolderView folder={self.folder} langtag={langtag}/>);
      }
    });
  },

  renderPage : function (page) {
    React.render(page, document.getElementById('tableaux'));
  }
});

module.exports = TableauxRouter;