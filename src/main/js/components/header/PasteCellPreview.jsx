import React from "react";
import {pure, withHandlers} from "recompose";
import f from "lodash/fp";
import LinkCell from "../cells/link/LinkCell";
import AttachmentCell from "../cells/attachment/AttachmentCell";
import NumericCell from "../cells/numeric/NumericCell";
import BooleanCell from "../cells/boolean/BooleanCell";
import DateTimeCell from "../cells/datetime/DateTimeCell";
import DateCell from "../cells/date/DateCell";
import ShortTextCell from "../cells/text/ShortTextCell";
import IdentifierCell from "../cells/identifier/IdentifierCell";
import CurrencyCell from "../cells/currency/CurrencyCell";
import TextCell from "../cells/text/TextCell";
import {ColumnKinds} from "../../constants/TableauxConstants";
import ActionCreator from "../../actions/ActionCreator";

const ClearCellButton = (props) => (
  <div className="clear-pasted-button">
    <a href="#"
       onClick={props.clearCellClipboard}
    >
      <i className="fa fa-times" />
    </a>
  </div>
);

const FocusCellButton = withHandlers({
  focusCell: (props) => () => ActionCreator.toggleCellSelection(props.cell, true)
})(
  (props) => (
    <div className="focus-cell-button">
      <a href="#"
         onClick={props.focusCell}
      >
        <i className="fa fa-sign-in" />
      </a>
    </div>
  )
);

const cellRenderers = {
  [ColumnKinds.link]: LinkCell,
  [ColumnKinds.attachment]: AttachmentCell,
  [ColumnKinds.numeric]: NumericCell,
  [ColumnKinds.boolean]: BooleanCell,
  [ColumnKinds.date]: DateCell,
  [ColumnKinds.datetime]: DateTimeCell,
  [ColumnKinds.shorttext]: ShortTextCell,
  [ColumnKinds.concat]: IdentifierCell,
  [ColumnKinds.currency]: CurrencyCell,
  [ColumnKinds.text]: TextCell,
  [ColumnKinds.richtext]: TextCell,
  [ColumnKinds.group]: IdentifierCell
};

const CellPreview = (props) => {
  const cell = props.pasteOriginCell;
  const langtag = props.pasteOriginCellLang;

  const CellType = cellRenderers[cell.kind];

  return (
    <div className="cell-preview">
      <div className={`cell cell-${cell.kind}`}>
        <CellType cell={cell}
                  langtag={langtag}
                  selected={false}
                  editing={false}
                  value={cell.displayValue[langtag] || ""}
                  contentChanged={f.noop}
                  setCellKeyboardShortcuts={f.noop}
        />
      </div>
    </div>
  );
};

const PasteCellPreview = (props) => {
  const {clearCellClipboard, pasteOriginCell} = props;

  return (
    <div className={"clipboard-popup"}>
      <CellPreview {...props} />
      <div className="buttons">
        <FocusCellButton cell={pasteOriginCell} />
        <ClearCellButton clearCellClipboard={clearCellClipboard} />
      </div>
    </div>
  );
};

export default pure(PasteCellPreview);
