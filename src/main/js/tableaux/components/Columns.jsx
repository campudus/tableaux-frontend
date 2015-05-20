var React = require('react');
var AmpersandMixin = require('ampersand-react-mixin');

var Columns = React.createClass({
  mixins : [AmpersandMixin],

  render : function () {
    console.log('rendering columns', this.props.columns);
    return (
      <tr className="heading">
        {this.props.columns.map(function (col, index) {
          return <th key={index}>{col.name}</th>;
        })}
      </tr>
    );
  }
});

module.exports = Columns;
