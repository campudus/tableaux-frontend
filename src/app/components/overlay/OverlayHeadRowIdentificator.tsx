import f from "lodash/fp";
import { ReactElement } from "react";
import { useSelector } from "react-redux";
import { Cell, CellValue, Column, GRUDStore } from "../../types/grud";
import { retrieveTranslation } from "../../helpers/multiLanguage";
import getDisplayValue from "../../helpers/getDisplayValue";

type OverlayHeadRowIdentificatorProps = {
  langtag: string;
  cell?: Pick<Cell, "table" | "row"> & Partial<Pick<Cell, "column">>;
};

function OverlayHeadRowIdentificator({
  langtag,
  cell
}: OverlayHeadRowIdentificatorProps): ReactElement | null {
  if (!cell) {
    return null;
  }

  const firstColumn = useSelector<GRUDStore, Column | undefined>(state => {
    const column = state.columns[cell.table.id]?.data?.at(0) as Column & {
      originColumns: Array<{ tableId: number; column: Column }>;
    };
    return (
      column?.originColumns?.find(oc => oc.tableId === cell.row.id)?.column ??
      column
    );
  });
  const firstCellValue = useSelector<GRUDStore, CellValue["value"] | undefined>(
    state => {
      const rows = state.rows[cell.table.id]?.data;
      const row = rows?.find(r => r.id === cell.row.id) ?? cell.row;
      return row?.values.at(0);
    }
  );
  const translate = retrieveTranslation(langtag);
  const displayValue = getDisplayValue(firstColumn)(firstCellValue);
  const title = f.isArray(displayValue)
    ? displayValue.map(translate).join(" ")
    : translate(displayValue);
  const columnName = translate(cell.column?.displayName);

  return (
    <span>
      <span className="column-name">
        {!f.isEmpty(columnName) ? `${columnName}: ` : ""}
      </span>
      <span className="row-title">{title}</span>
    </span>
  );
}

export default OverlayHeadRowIdentificator;
