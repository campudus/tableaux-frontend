var React = require('react');
var Cell = require('./Cell.jsx');

var Row = React.createClass({
  render : function () {
    return (
      <tr className="row">
        <Cell value={this.props.value}/>
        <Cell value="one"/>
        <Cell value="two"/>
        <Cell value="three"/>
      </tr>
    );
  }
});

module.exports = Row;
