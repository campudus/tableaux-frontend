var React = require('react');
var AmpersandMixin = require('ampersand-react-mixin');

var Row = require('./Row.jsx');

var Rows = React.createClass({
  mixins : [AmpersandMixin],

  displayName : 'Rows',

  propTypes : {
    langtag : React.PropTypes.string.isRequired,
    rows : React.PropTypes.object.isRequired,
    selectedCell : React.PropTypes.object,
    selectedCellEditing : React.PropTypes.bool,
    expandedRowIds : React.PropTypes.array,
    selectedCellExpandedRow : React.PropTypes.string
  },

  isRowExpanded : function (rowId) {
    return (this.props.expandedRowIds && this.props.expandedRowIds.indexOf(rowId) > -1);
  },

  render : function () {
    var self = this;
    var rows = this.props.rows.map(function (row, idx) {
      return <Row key={idx} row={row} selectedCell={self.props.selectedCell}
                  selectedCellEditing={self.props.selectedCellEditing}
                  selectedCellExpandedRow={self.props.selectedCellExpandedRow}
                  langtag={self.props.langtag}
                  expanded={self.isRowExpanded(row.id)}/>
    });

    return <div className="data">{rows}</div>;
  }
});

module.exports = Rows;
