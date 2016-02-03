var React = require('react');
var AmpersandMixin = require('ampersand-react-mixin');

var Columns = React.createClass({
  mixins : [AmpersandMixin],

  propTypes : {},

  renderColumn : function (column, index) {
    var columnContent = [];
    if (column.kind === "concat") {
      columnContent.push(<i key="column-icon" className="fa fa-bookmark"/>);
    } else if (column.identifier) {
      columnContent.push(<i key="column-icon" className="fa fa-bookmark-o"/>);
    }
    columnContent.push(<span key="column-name">{column.name}</span>);
    return <div className="column-head" key={index}>{columnContent}</div>
  },

  render : function () {
    var self = this;
    return (
      <div id="tableHeader" ref="tableHeader" className="heading">
        <div className="tableHeader-inner">
          <div className="column-head language" key="-1"></div>
          {
            this.props.columns.map(function (column, index) {
              return self.renderColumn(column, index);
              })
            }
        </div>
      </div>
    );
  }
});

module.exports = Columns;
