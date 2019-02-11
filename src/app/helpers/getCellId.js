export const getCellId = ({ table, column, row }) =>
  `${column.kind}-${table.id}-${column.id}-${row.id}`;

export const addCellId = cell => ({ ...cell, id: getCellId(cell) });
