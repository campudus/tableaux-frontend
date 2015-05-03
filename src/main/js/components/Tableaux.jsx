var React = require('react');
var Row = require('./tableaux/Row.jsx');

var Tableaux = React.createClass({
  render : function () {
    return (
      <div className="tableaux">
        <table>
          <Row value="hello"/>
          <Row value="and"/>
          <Row value="bye"/>
        </table>
      </div>
    );
  }
});

module.exports = Tableaux;