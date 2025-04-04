import { Column, ColumnKind } from "../types/grud";
import { ColumnKinds } from "../constants/TableauxConstants";

const columnKindsWithoutHistory: ColumnKind[] = [
  ColumnKinds.group,
  ColumnKinds.concat,
  ColumnKinds.status
];

export const hasHistory = ({ column }: { column: Column }): boolean =>
  !columnKindsWithoutHistory.includes(column.kind);
