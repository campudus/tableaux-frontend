var React = require('react');
var app = require('ampersand-app');

var Folder = require('./tableaux/models/media/Folder');
var FolderView = require('./tableaux/components/media/Folder.jsx');

app.extend({
  init : function () {
    if (this.getParam('folder')) {
      this.folder = new Folder({id : parseInt(this.getParam('folder'))})
    } else {
      this.folder = new Folder({id : null});
    }

    this.folder.fetch();

    this.render();
  },

  render : function () {
    var self = this;
    React.render(<FolderView folder={self.folder}/>, document.getElementById('tableaux'));
  },

  getParam : function (name) {
    if (name = (new RegExp('[?&]' + encodeURIComponent(name) + '=([^&]*)')).exec(location.search)) {
      return decodeURIComponent(name[1]);
    }
  }
});

app.init();
