var app = require('ampersand-app');
var Router = require('./router');

app.extend({
  init : function () {
    this.router = new Router();
    this.router.history.start();
  }
});

app.init();
