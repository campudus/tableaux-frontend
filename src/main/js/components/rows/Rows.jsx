import React from "react";
import AmpersandMixin from "ampersand-react-mixin";
import Infinite from "../../thirdparty/react-infinite/react-infinite.js";
import Row from "./Row.jsx";
import NewRow from "./NewRow.jsx";
import {RowHeight} from "../../constants/TableauxConstants";
import connectToAmpersand from "../../helpers/connectToAmpersand";

@connectToAmpersand
class Rows extends React.Component {

  displayName = 'Rows';

  constructor(props) {
    super(props);
    this.numberOfRows = 0;
  }

  shouldComponentUpdate(nP) {
    const {selectedCell, selectedCellEditing, shouldCellFocus, langtag, rows, expandedRowIds, selectedCellExpandedRow, rowsHeight} = this.props;
    if (nP.rows.length != this.numberOfRows) { // forcing update on rows.onAdd leads to exponential render calls
      this.numberOfRows = nP.rows.length;
      return true;
    }
    if (selectedCell !== nP.selectedCell
      || selectedCellEditing !== nP.selectedCellEditing
      || langtag !== nP.langtag
      || shouldCellFocus !== nP.shouldCellFocus
      || expandedRowIds !== nP.expandedRowIds
      || selectedCellExpandedRow !== nP.selectedCellExpandedRow
      || rowsHeight !== nP.rowsHeight
    ) {
      return true;
    }
   console.log("! Rows skipped update");
    return false;
  };

  isRowExpanded(rowId) {
    const {expandedRowIds} = this.props;
    return (expandedRowIds && expandedRowIds.indexOf(rowId) > -1) || false;
  };

  //Is this row, including all associated multilanguage rows selected?
  isRowSelected(row) {
    const {selectedCell} = this.props;
    if (selectedCell) {
      return (row.getId() === selectedCell.rowId);
    } else {
      return false;
    }
  };

  getRows() {
    const self = this;
    const {table, rows, langtag} = this.props;

    if (rows) {
      const renderedRows = rows.map(function (row, idx) {
        const isRowSelected = self.isRowSelected(row);
        const isRowExpanded = self.isRowExpanded(row.id);

        const selectedCellVal = isRowSelected ? self.props.selectedCell : null;
        const selectedCellEditingVal = isRowSelected ? self.props.selectedCellEditing : null;
        const selectedCellExpandedRowVal = isRowSelected ? self.props.selectedCellExpandedRow : null;
        const shouldCellFocusVal = isRowSelected ? self.props.shouldCellFocus : false;

        return <Row key={idx} row={row} selectedCell={selectedCellVal}
                    selectedCellEditing={selectedCellEditingVal}
                    selectedCellExpandedRow={selectedCellExpandedRowVal}
                    langtag={langtag}
                    table={table}
                    isRowExpanded={isRowExpanded}
                    isRowSelected={isRowSelected}
                    shouldCellFocus={shouldCellFocusVal}
        />
      });

      if (table.type !== 'settings') {
        renderedRows.push(<NewRow key="new-row" table={table} langtag={langtag} />);
      }

      return renderedRows;
    } else {

      return null;
    }
  };

  render() {
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
}
;

Rows.propTypes = {
  langtag: React.PropTypes.string.isRequired,
  rows: React.PropTypes.object.isRequired,
  selectedCell: React.PropTypes.object,
  selectedCellEditing: React.PropTypes.bool,
  expandedRowIds: React.PropTypes.array,
  selectedCellExpandedRow: React.PropTypes.string,
  rowsHeight: React.PropTypes.number,
  shouldCellFocus: React.PropTypes.bool,
  table: React.PropTypes.object.isRequired
};

export default Rows;
