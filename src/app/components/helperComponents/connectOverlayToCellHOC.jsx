import { withProps } from "recompose";
import { idsToIndices } from "../../redux/redux-helpers";

export const connectOverlayToCellValue = withProps(props => {
  const { cell, grudData } = props;
  // console.log("props:", props);
  try {
    const { rows } = grudData;
    const [rowIdx, columnIdx] = idsToIndices(
      { columnId: cell.column.id, rowId: cell.row.id, tableId: cell.table.id },
      grudData
    );
    return { value: rows[cell.table.id].data[rowIdx].values[columnIdx] };
  } catch (err) {
    console.error("Error connecting element:", err);
    return {};
  }
});
