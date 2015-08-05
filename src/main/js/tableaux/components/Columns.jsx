var React = require('react');
var AmpersandMixin = require('ampersand-react-mixin');

var Columns = React.createClass({
  mixins : [AmpersandMixin],

  render : function () {
    console.log('rendering columns', this.props.columns);
    return (
      <div className="heading">
        {this.props.columns.map(function (col, index) {
          return <div className="column-head" key={index}>{col.name}</div>;
        })}
      </div>
    );
  }
});

module.exports = Columns;
