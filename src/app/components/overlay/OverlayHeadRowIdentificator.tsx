import f from "lodash/fp";
import { ReactElement } from "react";
import { useSelector } from "react-redux";
import { Cell, Column, GRUDStore, Row } from "../../types/grud";
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

  const firstColumn = useSelector<GRUDStore, Column>(state => {
    const columns = state.columns[cell.table.id]?.data;
    return columns.at(0)!;
  });
  const firstRowValue = useSelector<GRUDStore, Row["values"][number]>(state => {
    const rows = state.rows[cell.table.id]?.data;
    const row = rows.find(r => r.id === cell.row.id) ?? cell.row;
    return row.values.at(0)!;
  });
  const displayValue = getDisplayValue(firstColumn)(firstRowValue);
  const title = retrieveTranslation(langtag)(displayValue);
  const columnName = retrieveTranslation(langtag)(cell.column?.displayName);

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
