var React = require('react');
var Tableaux = require('./components/Tableaux.jsx');
var tableaux = require('./tableaux.js');

React.render(<Tableaux tableaux={tableaux} />, document.getElementById('tableaux'));
