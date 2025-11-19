import f from "lodash/fp";

const shouldStartForTable = ({
  allDisplayValues,
  columns,
  finishedLoading,
  startedGeneratingDisplayValues,
  table,
  rows
}) =>
  !f.isEmpty(columns) &&
  (f.isNil(allDisplayValues[table.id]) ||
    allDisplayValues[table.id].length !== rows.length) &&
  !startedGeneratingDisplayValues &&
  finishedLoading;

const startForTable = ({
  actions: { generateDisplayValues },
  columns,
  langtag,
  rows,
  table
}) => {
  generateDisplayValues(rows, columns, table, langtag);
};

export default {
  shouldStartForTable,
  startForTable
};
