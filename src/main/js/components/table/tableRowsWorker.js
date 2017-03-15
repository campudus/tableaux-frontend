import ActionCreator from "../../actions/ActionCreator";
import React from "react";
import {RowHeight} from "../../constants/TableauxConstants";
import {disableShouldCellFocus, setNextSelectedCell, isLastRowSelected} from "./tableNavigationWorker";
import {Directions} from "../../constants/TableauxConstants";
import {translate} from "react-i18next";

const DuplicatedMessage = (props) => {
  const {row, t, onJumpToRow} = props;
  const onClickHandler = (e) => {
    onJumpToRow(row);
  };
  return (
    <div>
      <p>{t("row_duplicated")}</p>
      <a href="#" onClick={onClickHandler}>{t("jump_to_row")} <i className="fa fa-angle-right"/></a>
    </div>
  );
};
const TranslatedDuplicatedMessage = translate(["table"])(DuplicatedMessage);

export function duplicateRow(payload) {
  const {rows} = this.props;
  const {rowId} = payload;
  const rowToCopy = rows.get(rowId);
  rowToCopy.duplicate((row) => {
    ActionCreator.showToast(<TranslatedDuplicatedMessage row={row} onJumpToRow={scrollToRow.bind(this)}/>, 3000, true);
  });
}

// TODO: Move all this to rows component, with props/actions. Problem is, this executes faster, than the row added to dom, so we get old height.
// TODO: Scroll to row, not just to the bottom
export function scrollToRow(row) {
  const {tableRowsDom} = this;
  const {rows} = this.props;
  const indexOfRow = rows.indexOf(row);
  const yPositionRow = RowHeight * indexOfRow;
  const rowsDomHeight = tableRowsDom.scrollHeight;
  // const rowsDomScrollTop = tableRowsDom.scrollTop;
  const rowsViewportHeight = tableRowsDom.clientHeight;
  console.log("row added at index:", indexOfRow, ". jump to bottom at y:", yPositionRow + RowHeight - rowsViewportHeight, ", new row:", row, " is duplicated", row.recentlyDuplicated);

  disableShouldCellFocus.call(this);
  tableRowsDom.scrollTop = rowsDomHeight - rowsViewportHeight;
}

export function rowAdded() {
  if (this.selectNewCreatedRow) {
    this.selectNewCreatedRow = false;
    setNextSelectedCell.call(this, Directions.DOWN);
  }
}

export function createRowOrSelectNext() {
  if (isLastRowSelected.call(this)) {
    this.selectNewCreatedRow = true;
    ActionCreator.addRow(this.props.table.id);
  } else {
    setNextSelectedCell.call(this, Directions.DOWN);
  }
}

export function toggleRowExpand(payload) {
  var toggleRowId = payload.rowId;
  var newExpandedRowIds = _.clone(this.state.expandedRowIds) || [];
  var rowIdExists = false;

  newExpandedRowIds.forEach((rowId, index) => {
    if (rowId === toggleRowId) {
      // already expanded: remove to close expanding row
      newExpandedRowIds.splice(index, 1);
      rowIdExists = true;
    }
  });

  // expand this row
  if (!rowIdExists) {
    newExpandedRowIds.push(toggleRowId);
  }

  this.setState({
    expandedRowIds: newExpandedRowIds
  });
}
