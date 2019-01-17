import { withProps } from "recompose";
import { idsToIndices } from "../../redux/redux-helpers";

export const connectOverlayToCellValue = withProps(({ cell, grudData }) => {
  const { rows } = grudData;
  const [rowIdx, columnIdx] = idsToIndices(
    { columnId: cell.column.id, rowId: cell.row.id, tableId: cell.table.id },
    grudData
  );
  return { value: rows[cell.table.id].data[rowIdx].values[columnIdx] };
});
