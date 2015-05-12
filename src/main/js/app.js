var React = require('react');
var Tableaux = require('./tableaux/components/Tableaux.jsx');
var Tables = require('./tableaux/TableauxStore').Tables;
var store = new Tables([], {});

React.render(<Tableaux collection={store}/>, document.getElementById('tableaux'));
