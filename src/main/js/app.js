var React = require('react');
var Tableaux = require('./tableaux/components/Tableaux.jsx');
var TableauxStore = require('./tableaux/TableauxStore').store;
var store = new TableauxStore();

React.render(<Tableaux collection={store}/>, document.getElementById('tableaux'));
