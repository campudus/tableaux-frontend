var React = require('react');
var Tableaux = require('./components/Tableaux.jsx');
var store = require('./tableaux.js');

store.onLoadRegister(function () {
  console.log('loaded tableaux');
  React.render(<Tableaux tableaux={store} />, document.getElementById('tableaux'));
});
