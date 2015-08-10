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
    this.tables.fetch({
      success : function (collection) {
        if (typeof collection.at(0) !== 'undefined') {
          self.redirectTo('table/' + collection.at(0).getId());
        }
      }
    });
  },

  tableBrowser : function (tableid) {
    console.log("Router.tableBrowser", tableid);

    if (typeof tableid === 'undefined' || isNaN(parseInt(tableid))) {
      console.error("path param tableid is not valid");
      return;
    }

    var self = this;
    this.tables = new Tables();
    this.tables.fetch({
      success : function () {
        var id = parseInt(tableid);
        var key = 'tableaux' + id;

        self.renderPage(<Tableaux key={key} tables={self.tables} currentTableId={id}/>);
      }
    });
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
    console.log("renderPage", page);
    React.render(page, document.getElementById('tableaux'));
  }
});

module.exports = tableauxRouter;