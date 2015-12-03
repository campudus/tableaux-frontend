var React = require('react');
var AmpersandMixin = require('ampersand-react-mixin');
var tableHeaderDefaultCoordinates;

var Columns = React.createClass({
  mixins : [AmpersandMixin],

  propTypes : {},

  componentDidUpdate : function () {

  },

  componentDidMount : function () {

  },

  componentWillUnmount : function () {

  },

  render : function () {
    return (
      <div id="tableHeader" ref="tableHeader" className="heading">
        <div className="tableHeader-inner">
          <div className="column-head language" key="-1"></div>
          {this.props.columns.map(function (col, index) {
            return <div className="column-head" key={index}>{col.name}</div>;
            })}
        </div>
      </div>
    );
  }
});

module.exports = Columns;
