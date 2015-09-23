var React = require('react');
var AmpersandMixin = require('ampersand-react-mixin');

var Row = require('./Row.jsx');

var Rows = React.createClass({
  mixins : [AmpersandMixin],

  render : function () {
    return (
      <div className="data">
        {this.props.rows.map(function (row, idx) {
          return <Row key={idx} row={row}/>
        })}
      </div>
    );
  }
});

module.exports = Rows;
