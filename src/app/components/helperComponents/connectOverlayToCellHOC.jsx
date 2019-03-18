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

    return {
      value: linkedRow.data[rowIdx].values[columnIdx],
      grudData: grudData
    };
  } catch (err) {
    console.error("Error connecting element:", err);
    return {};
  }
});
