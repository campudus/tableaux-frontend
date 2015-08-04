var Router = require('ampersand-router');
var React = require('react');

var Folder = require('./tableaux/models/media/Folder');
var Tables = require('./tableaux/models/Tables');

var FolderView = require('./tableaux/components/media/Folder.jsx');
var Tableaux = require('./tableaux/components/Tableaux.jsx');

var tableauxRouter = Router.extend({
  routes : {
    '' : 'home',
    'media' : 'mediaBrowser',
    'media/:folderid' : 'mediaBrowser'
  },

  home : function () {
    var self = this;
    this.tables = new Tables();

    this.renderPage(<Tableaux tables={self.tables}/>);
  },

  mediaBrowser : function (folderid) {
    if (folderid === 'undefined') {
      this.folder = new Folder();
    } else {
      this.folder = new Folder({id : parseInt(folderid)});
    }
    this.folder.fetch();

    this.renderPage(<FolderView folder={this.folder}/>);
  },

  renderPage : function (page) {
    React.render(page, document.getElementById('tableaux'));
  }
});

module.exports = tableauxRouter;