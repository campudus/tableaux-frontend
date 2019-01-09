import f from "lodash/fp";
import { ColumnKinds } from "../constants/TableauxConstants";

const mapIndexed = f.map.convert({ cap: false });
const getLinkColumns = columns =>
  f.compose(
    f.compact,
    mapIndexed((column, index) => {
      const { kind } = column;
      if (kind == ColumnKinds.link) {
        const {
          toColumn: { id },
          toTable
        } = column;
        return { index: index, columnId: id, tableId: toTable };
      }
      return null;
    })
  )(columns);

const identifyUniqueLinkedRows = (rows, columns) => {
  const linkColumns = getLinkColumns(columns);
  const linkIndexes = f.map("index", linkColumns);

  return f.compose(
    mapIndexed((arr, index) => {
      const { columnId, tableId } = linkColumns[index];
      return { tableId, columnId, rowIds: arr };
    }),
    f.map(f.uniq),
    f.map(f.map("id")),
    f.map(f.flatten),
    f.zipAll,
    f.map(f.props(linkIndexes)),
    f.map("values")
  )(rows);
};

export default identifyUniqueLinkedRows;
