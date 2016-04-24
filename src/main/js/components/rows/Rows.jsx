var React = require('react');
var AmpersandMixin = require('ampersand-react-mixin');
var Infinite = require('../../thirdparty/react-infinite/react-infinite.js');
var NewRow = require('./NewRow.jsx');
import {RowHeight} from '../../constants/TableauxConstants';

var Row = require('./Row.jsx');

var Rows = React.createClass({
  mixins : [AmpersandMixin],

  displayName : 'Rows',

  propTypes : {
    langtag : React.PropTypes.string.isRequired,
    rows : React.PropTypes.object,
    selectedCell : React.PropTypes.object,
    selectedCellEditing : React.PropTypes.bool,
    expandedRowIds : React.PropTypes.array,
    selectedCellExpandedRow : React.PropTypes.string,
    rowsHeight : React.PropTypes.number,
    shouldCellFocus : React.PropTypes.bool
  },

  shouldComponentUpdate(nP) {
    const {selectedCell, selectedCellEditing, shouldCellFocus, langtag, rows, expandedRowIds, selectedCellExpandedRow, rowsHeight} = this.props;
    if (selectedCell !== nP.selectedCell
      || selectedCellEditing !== nP.selectedCellEditing
      || langtag !== nP.langtag
      || shouldCellFocus !== nP.shouldCellFocus
      || rows !== nP.rows
      || expandedRowIds !== nP.expandedRowIds
      || selectedCellExpandedRow !== nP.selectedCellExpandedRow
      || rowsHeight !== nP.rowsHeight
    ) {
      return true;
    }
    console.log("! Rows skipped update");
    return false;
  },

  isRowExpanded : function (rowId) {
    return (this.props.expandedRowIds && this.props.expandedRowIds.indexOf(rowId) > -1) || false;
  },

  //Is this row, including all associated multilanguage rows selected?
  isRowSelected : function (row) {
    var currentSelectedCell = this.props.selectedCell;
    if (currentSelectedCell) {
      return (row.getId() === currentSelectedCell.rowId);
    } else {
      return false;
    }
  },

  getRows : function () {
    var self = this;
    if (this.props.rows) {
      var rows = this.props.rows.map(function (row, idx) {
        var isRowSelected = self.isRowSelected(row);
        var isRowExpanded = self.isRowExpanded(row.id);
        var selectedCellVal = isRowSelected ? self.props.selectedCell : null;
        var selectedCellEditingVal = isRowSelected ? self.props.selectedCellEditing : null;
        var selectedCellExpandedRowVal = isRowSelected ? self.props.selectedCellExpandedRow : null;
        var shouldCellFocusVal = isRowSelected ? self.props.shouldCellFocus : false;

        return <Row key={idx} row={row} selectedCell={selectedCellVal}
                    selectedCellEditing={selectedCellEditingVal}
                    selectedCellExpandedRow={selectedCellExpandedRowVal}
                    langtag={self.props.langtag}
                    isRowExpanded={isRowExpanded}
                    isRowSelected={isRowSelected}
                    shouldCellFocus={shouldCellFocusVal}
        />

      });
      rows.push(<NewRow key="new-row" table={this.props.table} langtag={this.props.langtag}/>);

      return rows;
    } else return null;

  },

  render : function () {
    return (
      <Infinite className="data-wrapper"
                containerHeight={this.props.rowsHeight}
                elementHeight={RowHeight}
                preloadBatchSize={Infinite.containerHeightScaleFactor(0.1)}
                preloadAdditionalHeight={Infinite.containerHeightScaleFactor(1)}
                handleScroll={undefined}
                timeScrollStateLastsForAfterUserScrolls={10}
                scrollDelayTime={100}>
        {this.getRows()}
      </Infinite>
    );
  }
});

module.exports = Rows;
