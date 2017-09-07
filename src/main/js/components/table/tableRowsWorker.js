import ActionCreator from "../../actions/ActionCreator";
import React from "react";
import {Directions} from "../../constants/TableauxConstants";
import {isLastRowSelected, setNextSelectedCell} from "./tableNavigationWorker";
import {translate} from "react-i18next";
import _ from "lodash";

const DuplicatedMessage = (props) => {
  const {row, t, onJumpToRow} = props;
  const onClickHandler = (e) => {
    onJumpToRow(row);
  };
  return (
    <div>
      <p>{t("row_duplicated")}</p>
      <a href="#" onClick={onClickHandler}>{t("jump_to_row")} <i className="fa fa-angle-right" /></a>
    </div>
  );
};

const TranslatedDuplicatedMessage = translate(["table"])(DuplicatedMessage);

export function duplicateRow(payload) {
  const {rows} = this.props;
  const {rowId} = payload;
  const rowToCopy = rows.get(rowId);
  rowToCopy.safelyDuplicate((row) => {
    ActionCreator.showToast(<TranslatedDuplicatedMessage row={row} onJumpToRow={ActionCreator.jumpToDupe} />, 3000, true);
  });
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
  const toggleRowId = payload.rowId;
  const newExpandedRowIds = _.clone(this.state.expandedRowIds) || [];
  let rowIdExists = false;

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
