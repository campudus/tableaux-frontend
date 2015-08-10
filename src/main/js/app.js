var app = require('ampersand-app');
var Router = require('./router');

var EditFilesCollection = require('./tableaux/models/media/EditFilesCollection');

app.extend({
  init : function () {
    this.router = new Router();
    this.router.history.start();

    this.editFilesCollection = new EditFilesCollection();
  }
});

app.init();
