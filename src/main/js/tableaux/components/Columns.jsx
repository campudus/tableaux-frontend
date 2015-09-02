var React = require('react');
var AmpersandMixin = require('ampersand-react-mixin');

var Columns = React.createClass({
  mixins : [AmpersandMixin],

  render : function () {
    return (
      <div className="heading">
        <div className="column-head language" key="-1"></div>
        {this.props.columns.map(function (col, index) {
          return <div className="column-head" key={index}>{col.name}</div>;
        })}
      </div>
    );
  }
});

module.exports = Columns;
