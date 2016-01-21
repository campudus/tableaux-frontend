var React = require('react');
var AmpersandMixin = require('ampersand-react-mixin');
var Infinite = require('react-infinite');
var NewRow = require('./NewRow.jsx');


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
    selectedCellExpandedRow : React.PropTypes.string,
    rowsHeight : React.PropTypes.number

  },

  isRowExpanded : function (rowId) {
    return (this.props.expandedRowIds && this.props.expandedRowIds.indexOf(rowId) > -1) || false;
  },

  getRows : function () {
    var self = this;
    var rows = this.props.rows.map(function (row, idx) {
      return <Row key={idx} row={row} selectedCell={self.props.selectedCell}
                  selectedCellEditing={self.props.selectedCellEditing}
                  selectedCellExpandedRow={self.props.selectedCellExpandedRow}
                  langtag={self.props.langtag}
                  expanded={self.isRowExpanded(row.id)}/>
    });

    rows.push(<NewRow key="new-row" table={this.props.table} langtag={this.props.langtag}/>);

    return rows;
  },

  handleInfiniteScroll : function (node) {

  },

  render : function () {
    return (
        <Infinite className="data-wrapper"
                  containerHeight={this.props.rowsHeight}
                  elementHeight={46}
                  preloadBatchSize={Infinite.containerHeightScaleFactor(0.05)}
                  preloadAdditionalHeight={Infinite.containerHeightScaleFactor(1)}
                  handleScroll={this.handleInfiniteScroll}>
          {this.getRows()}
        </Infinite>
    );
  }
});

module.exports = Rows;
