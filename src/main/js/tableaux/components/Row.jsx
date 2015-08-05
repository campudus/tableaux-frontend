var React = require('react');
var AmpersandMixin = require('ampersand-react-mixin');
var Cell = require('./Cell.jsx');

var Row = React.createClass({
  mixins : [AmpersandMixin],

  render : function () {
    var className = 'row row-' + this.props.row.getId();
    return (
      <div className={className}>
        {this.props.row.cells.map(function (cell, idx) {
          return <Cell key={idx} cell={cell}/>;
        })}
      </div>
    );
  }
});

module.exports = Row;
