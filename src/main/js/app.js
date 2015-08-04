var App = require('ampersand-app');
var Router = require('./router');

App.extend({
  init : function () {
    this.router = new Router();
    this.router.history.start();
  }
});

App.init();
