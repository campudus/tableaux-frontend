import f from "lodash/fp";
import i18n from "i18next";
import { ComponentType, ReactElement } from "react";
import {
  Cell,
  CellValue,
  Column,
  ColumnKind,
  Row,
  Table
} from "../../types/grud";
import Popup from "../helperComponents/Popup";
import LinkCell from "../cells/link/LinkCell";
import AttachmentCell from "../cells/attachment/AttachmentCell";
import NumericCell from "../cells/numeric/NumericCell";
import BooleanCell from "../cells/boolean/BooleanCell";
import DateCell from "../cells/date/DateCell";
import ShortTextCell from "../cells/text/ShortTextCell";
import IdentifierCell from "../cells/identifier/IdentifierCell";
import CurrencyCell from "../cells/currency/CurrencyCell";
import TextCell from "../cells/text/TextCell";
import StatusCell from "../cells/status/StatusCell";
import store from "../../redux/store";
import actions from "../../redux/actionCreators";
import { openInNewTab } from "../../helpers/apiUrl";

const CellMap: Record<
  ColumnKind,
  ComponentType<{
    actions: unknown;
    langtag: string;
    table: Table;
    column: Column;
    row: Row;
    cell: Cell;
    value: CellValue;
    displayValue: Cell["displayValue"];
    editing: boolean;
    selected: boolean;
    setCellKeyboardShortcuts: () => void;
  }>
> = {
  link: LinkCell,
  attachment: AttachmentCell,
  // @ts-expect-error type mismatch between PropTypes and actual TS-type
  numeric: NumericCell,
  // @ts-expect-error type mismatch between PropTypes and actual TS-type
  boolean: BooleanCell,
  date: DateCell,
  datetime: DateCell,
  shorttext: ShortTextCell,
  concat: IdentifierCell,
  currency: CurrencyCell,
  text: TextCell,
  richtext: TextCell,
  group: IdentifierCell,
  status: StatusCell
};

type PasteCellIconProps = {
  clearCellClipboard: () => void;
  pasteOriginCellLang: string;
  pasteOriginCell?: Cell;
  tableId: number;
};

export default function PasteCellIcon({
  pasteOriginCell: cell,
  pasteOriginCellLang: langtag,
  clearCellClipboard,
  tableId
}: PasteCellIconProps): ReactElement | null {
  const { table, column, row, kind } = cell ?? {};
  const Cell = kind ? CellMap[kind] : null;

  if (f.isNil(cell) || f.isNil(Cell)) {
    return null;
  }

  const focusCell = () => {
    if (table?.id === tableId) {
      store.dispatch(
        actions.toggleCellSelection({
          langtag: langtag,
          tableId: table.id,
          columnId: column?.id,
          rowId: row?.id
        })
      );
    } else {
      openInNewTab({ langtag, table, column, row });
    }
  };

  return (
    <Popup
      className="clipboard-icon"
      trigger={<i className={"fa fa-clipboard"} />}
    >
      <div className={"clipboard-popup"}>
        <div className="heading">{i18n.t("header:clipboard.heading")}</div>
        <div className="cell-preview">
          <div className={`cell cell-${cell.kind}`}>
            <Cell
              cell={cell}
              column={cell.column}
              row={cell.row}
              table={cell.table}
              actions={actions}
              langtag={langtag}
              selected={false}
              editing={false}
              value={cell.value || ""}
              setCellKeyboardShortcuts={f.noop}
              displayValue={cell.displayValue}
            />
          </div>
        </div>
        <div className="buttons">
          <button
            className="focus-cell-button button positive"
            onClick={focusCell}
          >
            {i18n.t("header:clipboard.focus")}
          </button>

          <button
            className="clear-pasted-button button neutral"
            onClick={clearCellClipboard}
          >
            {i18n.t("header:clipboard.clear")}
          </button>
        </div>
      </div>
    </Popup>
  );
}
