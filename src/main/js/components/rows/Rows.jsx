import React from "react";
import Infinite from "../../thirdparty/react-infinite/react-infinite.js";
import Row from "./Row.jsx";
import NewRow from "./NewRow.jsx";
import {ActionTypes, RowHeight} from "../../constants/TableauxConstants";
import connectToAmpersand from "../helperComponents/connectToAmpersand";
import * as f from "lodash/fp";
import Spinner from "../header/Spinner";
import i18n from "i18next";
import Dispatcher from "../../dispatcher/Dispatcher";

@connectToAmpersand
class Rows extends React.Component {

  constructor(props) {
    super(props);
    this.numberOfRows = 0;
    this.displayName = "Rows";
    this.state = {openAnnotations: {}};
  }

  shouldComponentUpdate(nP, nS) {
    const {selectedCell, selectedCellEditing, shouldCellFocus, langtag, rows, expandedRowIds, selectedCellExpandedRow, rowsHeight} = this.props;
    if (nP.rows.length !== this.numberOfRows) { // forcing update on rows.onAdd leads to exponential render calls
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
    const idOf = f.prop("id");
    // create pairs of old/new elements, check ids at same index
    // to detect resorting etc
    if (f.any(([a, b]) => idOf(a) !== idOf(b), f.zip(nP.rows.models, rows.models))) {
      return true;
    }
    // console.log("! Rows skipped update");
    return false;
  };

  componentDidMount = () => {
    Dispatcher.on(ActionTypes.OPEN_ANNOTATIONS_VIEWER, this.setOpenAnnotations);
    Dispatcher.on(ActionTypes.CLOSE_ANNOTATIONS_VIEWER, this.setOpenAnnotations);
  };

  componentWillUnmount = () => {
    Dispatcher.off(ActionTypes.OPEN_ANNOTATIONS_VIEWER, this.setOpenAnnotations);
    Dispatcher.off(ActionTypes.CLOSE_ANNOTATIONS_VIEWER, this.setOpenAnnotations);
  };

  setOpenAnnotations = (cellInfo) => {
    if (f.isNil(cellInfo) && !f.isEmpty(this.state.openAnnotations)) {
      this.setState({openAnnotations: {}}, this.forceUpdate);
    } else if (!f.isNil(cellInfo)) {
      this.setState({openAnnotations: cellInfo}, this.forceUpdate);
    }
  };

  getCellWithOpenAnnotations = (row) => {
    const openAnnotations = this.state.openAnnotations || {};
    return (row.id === openAnnotations.rowId)
      ? openAnnotations.cellId
      : null;
  };

  isRowExpanded(rowId) {
    const {expandedRowIds} = this.props;
    return (expandedRowIds && expandedRowIds.indexOf(rowId) > -1) || false;
  };

  // Is this row, including all associated multilanguage rows selected?
  isRowSelected(row) {
    const {selectedCell} = this.props;
    if (selectedCell) {
      return (row.getId() === selectedCell.rowId);
    } else {
      return false;
    }
  };

  getRows() {
    const {table, rows, langtag} = this.props;

    if (rows) {
      const renderedRows = rows.map((row, idx) => {
        const isRowSelected = this.isRowSelected(row);
        const isRowExpanded = this.isRowExpanded(row.id);

        const selectedCellVal = isRowSelected ? this.props.selectedCell : null;
        const selectedCellEditingVal = isRowSelected ? this.props.selectedCellEditing : null;
        const selectedCellExpandedRowVal = isRowSelected ? this.props.selectedCellExpandedRow : null;
        const shouldCellFocusVal = isRowSelected ? this.props.shouldCellFocus : false;

        return <Row key={idx} row={row} selectedCell={selectedCellVal}
                    selectedCellEditing={selectedCellEditingVal}
                    selectedCellExpandedRow={selectedCellExpandedRowVal}
                    langtag={langtag}
                    table={table}
                    isRowExpanded={isRowExpanded}
                    isRowSelected={isRowSelected}
                    shouldCellFocus={shouldCellFocusVal}
                    cellWithOpenAnnotations={this.getCellWithOpenAnnotations(row)}
        />;
      });

      if (f.isEmpty(rows.models)) {
        renderedRows.push(
          <div key="empty-text" className="table-has-no-rows">
            {i18n.t((f.isEmpty(table.rows.models)) ? "table:has-no-rows" : "table:search_no_results")}
          </div>
        );
      }

      if (table.type !== "settings") {
        renderedRows.push(<NewRow key="new-row" table={table} langtag={langtag} />);
      }

      return renderedRows;
    } else {
      return null;
    }
  };

  render() {
    return (
      (this.props.fullyLoaded)
        ? (
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
        )
        : <Spinner isLoading />
    );
  }
}

Rows.propTypes = {
  langtag: React.PropTypes.string.isRequired,
  rows: React.PropTypes.object.isRequired,
  selectedCell: React.PropTypes.object,
  selectedCellEditing: React.PropTypes.bool,
  expandedRowIds: React.PropTypes.array,
  selectedCellExpandedRow: React.PropTypes.string,
  rowsHeight: React.PropTypes.number,
  shouldCellFocus: React.PropTypes.bool,
  table: React.PropTypes.object.isRequired,
  fullyLoaded: React.PropTypes.bool.isRequired
};

export default Rows;
