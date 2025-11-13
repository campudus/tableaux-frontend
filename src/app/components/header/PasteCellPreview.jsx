import React from "react";
import { pure, withHandlers } from "recompose";
import f from "lodash/fp";
import LinkCell from "../cells/link/LinkCell";
import AttachmentCell from "../cells/attachment/AttachmentCell";
import NumericCell from "../cells/numeric/NumericCell";
import BooleanCell from "../cells/boolean/BooleanCell";
import DateCell from "../cells/date/DateCell";
import ShortTextCell from "../cells/text/ShortTextCell";
import IdentifierCell from "../cells/identifier/IdentifierCell";
import CurrencyCell from "../cells/currency/CurrencyCell";
import TextCell from "../cells/text/TextCell";
import { ColumnKinds } from "../../constants/TableauxConstants";
import i18n from "i18next";
import { openInNewTab } from "../../helpers/apiUrl";
import store from "../../redux/store";
import actions from "../../redux/actionCreators";

const ClearCellButton = props => (
  <button
    className="clear-pasted-button button neutral"
    onClick={props.clearCellClipboard}
  >
    {i18n.t("header:clipboard.clear")}
  </button>
);

const FocusCellButton = withHandlers({
  focusCell: props => () => {
    const { cell, langtag, tableId } = props;
    if (cell.table.id === tableId) {
      store.dispatch(
        actions.toggleCellSelection({
          langtag: langtag,
          tableId: cell.table.id,
          columnId: cell.column.id,
          rowId: cell.row.id
        })
      );
    } else {
      const { row, column, table } = cell;
      openInNewTab({ langtag, table, column, row });
    }
  }
})(props => (
  <button
    className="focus-cell-button button positive"
    onClick={props.focusCell}
  >
    {i18n.t("header:clipboard.focus")}
  </button>
));

const cellRenderers = {
  [ColumnKinds.link]: LinkCell,
  [ColumnKinds.attachment]: AttachmentCell,
  [ColumnKinds.numeric]: NumericCell,
  [ColumnKinds.boolean]: BooleanCell,
  [ColumnKinds.date]: DateCell,
  [ColumnKinds.datetime]: DateCell,
  [ColumnKinds.shorttext]: ShortTextCell,
  [ColumnKinds.concat]: IdentifierCell,
  [ColumnKinds.currency]: CurrencyCell,
  [ColumnKinds.text]: TextCell,
  [ColumnKinds.richtext]: TextCell,
  [ColumnKinds.group]: IdentifierCell,
  [ColumnKinds.integer]: NumericCell,
  [ColumnKinds.origintable]: ShortTextCell
};

const CellPreview = props => {
  const cell = props.pasteOriginCell;
  const langtag = props.pasteOriginCellLang;

  const CellType = cellRenderers[cell.kind];

  return (
    <div className="cell-preview">
      <div className={`cell cell-${cell.kind}`}>
        <CellType
          cell={cell}
          column={cell.column}
          row={cell.row}
          table={cell.table}
          actions={props.actions}
          langtag={langtag}
          selected={false}
          editing={false}
          value={cell.value || ""}
          contentChanged={f.noop}
          setCellKeyboardShortcuts={f.noop}
          displayValue={cell.displayValue}
        />
      </div>
    </div>
  );
};

const PasteCellPreview = props => {
  const {
    clearCellClipboard,
    pasteOriginCell,
    pasteOriginCellLang,
    tableId
  } = props;

  return (
    <div className={"clipboard-popup"}>
      <div className="heading">{i18n.t("header:clipboard.heading")}</div>
      <CellPreview {...props} />
      <div className="buttons">
        <FocusCellButton
          cell={pasteOriginCell}
          langtag={pasteOriginCellLang}
          tableId={tableId}
        />
        <ClearCellButton clearCellClipboard={clearCellClipboard} />
      </div>
    </div>
  );
};

export default pure(PasteCellPreview);
