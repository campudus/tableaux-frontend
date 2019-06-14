import { withProps } from "recompose";
import { idsToIndices } from "../../redux/redux-helpers";

export const connectOverlayToCellValue = withProps(props => {
  const { cell, grudData } = props;
  try {
    const { rows } = grudData;
    const { column, row, table } = cell;
    const [rowIdx, columnIdx] = idsToIndices(
      { columnId: column.id, rowId: row.id, tableId: table.id },
      grudData
    );
    const linkedRow = rows[table.id];
    const value = linkedRow.data[rowIdx].values[columnIdx];

    return {
      value,
      grudData: grudData,
      cell: { ...cell, value }
    };
  } catch (err) {
    console.error("Error connecting element:", err);
    return {};
  }
});
