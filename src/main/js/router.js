var Router = require('ampersand-router');
var React = require('react');

var Folder = require('./tableaux/models/media/Folder');
var Tables = require('./tableaux/models/Tables');

var FolderView = require('./tableaux/components/media/Folder.jsx');
var Tableaux = require('./tableaux/components/Tableaux.jsx');

var tableauxRouter = Router.extend({
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
    console.log("Router.noTable");

    var self = this;
    this.tables = new Tables();
    this.tables.fetch();

    this.tables.once('sync', function (collection, val) {
      if (typeof collection.at(0) !== 'undefined') {
        self.redirectTo('table/' + collection.at(0).getId());
      }
    });
  },

  tableBrowser : function (tableid) {
    console.log("Router.tableBrowser", tableid);

    var self = this;
    this.tables = new Tables();
    this.tables.fetch();

    if (typeof tableid !== 'undefined' && !isNaN(parseInt(tableid))) {
      this.renderPage(<Tableaux key={'tableaux' + parseInt(tableid)} tables={self.tables}
                                currentTableId={parseInt(tableid)}/>);
    }
  },

  mediaBrowser : function (folderid) {
    var self = this;

    if (typeof folderid === 'undefined') {
      this.folder = new Folder({id : null});
    } else {
      this.folder = new Folder({id : parseInt(folderid)});
    }

    this.folder.fetch();

    this.folder.once('sync', function () {
      self.renderPage(<FolderView folder={self.folder}/>);
    });
  },

  renderPage : function (page) {
    console.log("renderPage", page);
    React.render(page, document.getElementById('tableaux'));
  }
});

module.exports = tableauxRouter;