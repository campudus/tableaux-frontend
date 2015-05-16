var React = require('react');
var Tableaux = require('./tableaux/components/Tableaux.jsx');
var Store = require('./tableaux/TableauxStore');
var Tables = require('./tableaux/TableauxStore').Tables;
var store = new Tables([], {});

Store.init(function (err, tables) {
  if (!err) {
    React.render(<Tableaux collection={tables}/>, document.getElementById('tableaux'));
  } else {
    console.log('error!', err);
  }
});

