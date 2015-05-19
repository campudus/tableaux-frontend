var React = require('react');
var app = require('ampersand-app');
var Tables = require('./tableaux/models/Tables');
var Tableaux = require('./tableaux/components/Tableaux.jsx');

app.extend({
  init : function () {
    var self = this;
    this.tables = new Tables();
    React.render(<Tableaux tables={self.tables}/>, document.getElementById('tableaux'));
  }
});

app.init();
