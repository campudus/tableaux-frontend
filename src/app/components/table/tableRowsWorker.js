import { translate } from "react-i18next";
import React from "react";

// import { Directions } from "../../constants/TableauxConstants";
// import {
//   isLastRowSelected,
//   setNextSelectedCell
// } from "./tableNavigationWorker";
import actions from "../../redux/actionCreators";
import store from "../../redux/store";

const DuplicatedMessage = props => {
  const { row, t, onJumpToRow } = props;
  const onClickHandler = () => {
    onJumpToRow(row);
  };
  return (
    <div>
      <p>{t("row_duplicated")}</p>
      <a href="#" onClick={onClickHandler}>
        {t("jump_to_row")} <i className="fa fa-angle-right" />
      </a>
    </div>
  );
};

const TranslatedDuplicatedMessage = translate(["table"])(DuplicatedMessage);

export function duplicateRow(payload) {
  store.dispatch(
    actions.duplicateRow({
      ...payload,
      DuplicatedMessage: TranslatedDuplicatedMessage
    })
  );
  //   const { rows } = this.props;
  //   const { rowId } = payload;
  //   const rowToCopy = rows.get(rowId);
  //   rowToCopy.safelyDuplicate(row => {
  //     ActionCreator.showToast(
  //       <TranslatedDuplicatedMessage
  //         row={row}
  //         onJumpToRow={ActionCreator.jumpToDupe}
  //       />,
  //       3000,
  //       true
  //     );
  //   });
}

export function rowAdded() {
  if (this.selectNewCreatedRow) {
    this.selectNewCreatedRow = false;
    //   setNextSelectedCell.call(this, Directions.DOWN);
  }
}

export function createRowOrSelectNext() {
  //if (isLastRowSelected.call(this)) {
  //  this.selectNewCreatedRow = true;
  //  //    ActionCreator.addRow(this.props.table.id);
  //} else {
  //  setNextSelectedCell.call(this, Directions.DOWN);
  //}
}
