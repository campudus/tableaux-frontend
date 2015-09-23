var Router = require('ampersand-router');
var React = require('react');

var Folder = require('./models/media/Folder');
var Tables = require('./models/Tables');

var FolderView = require('./components/media/Folder.jsx');
var Tableaux = require('./components/Tableaux.jsx');

var Dispatcher = require('./dispatcher/Dispatcher');

var TableauxRouter = Router.extend({
  routes : {
    '' : 'home',
    'table' : 'noTable',
    'table/:tableid' : 'tableBrowser',
    'media' : 'mediaBrowser',
    'media/:folderid' : 'mediaBrowser'
  },

  home : function () {
    this.redirectTo('table');
  },

  noTable : function () {
    console.log("TableauxRouter.noTable");

    var self = this;

    this.tables = new Tables();
    this.tables.fetch({
      success : function (collection) {
        if (typeof collection.at(0) !== 'undefined') {
          self.redirectTo('table/' + collection.at(0).getId());
        }
      }
    });
  },

  tableBrowser : function (tableid) {
    console.log("TableauxRouter.tableBrowser", tableid);

    if (typeof tableid === 'undefined' || isNaN(parseInt(tableid))) {
      console.error("path param 'tableid' is not valid");
      return;
    }

    var self = this;

    var id = parseInt(tableid);
    var key = 'tableaux' + id;

    // router is called even if we switch through
    // tables with TableSwitcher but we only want to
    // re-render the page if we are called the very
    // first time
    if (this.alreadyCalled) {
      // Tableaux.jsx is listening on this
      // state will be changed which triggers
      // a React render
      Dispatcher.trigger('switch-table', {id : id});
    } else {
      this.alreadyCalled = true;

      // we could be called by route noTable
      // in this case `this.tables` is already
      // defined and fetched
      if (!this.tables) {
        this.tables = new Tables();
        this.tables.fetch({
          success : function () {
            self.renderPage(<Tableaux tables={self.tables} initialTableId={id}/>);
          }
        });
      } else {
        self.renderPage(<Tableaux tables={self.tables} initialTableId={id}/>);
      }
    }
  },

  mediaBrowser : function (folderid) {
    var self = this;

    if (typeof folderid === 'undefined') {
      this.folder = new Folder({id : null});
    } else {
      this.folder = new Folder({id : parseInt(folderid)});
    }

    this.folder.fetch({
      success : function () {
        self.renderPage(<FolderView folder={self.folder}/>);
      }
    });
  },

  renderPage : function (page) {
    React.render(page, document.getElementById('tableaux'));
  }
});

module.exports = TableauxRouter;