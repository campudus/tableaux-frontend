import { Column } from "grud-devtools/types";
import { ColumnKinds } from "../constants/TableauxConstants";

const columnKindsWithoutHistory = [
  ColumnKinds.group,
  ColumnKinds.concat,
  ColumnKinds.status
];

export const hasHistory = ({ column }: { column: Column }): boolean =>
  !columnKindsWithoutHistory.includes(column.kind);
