import f from "lodash/fp";

const shouldStartForTable = ({
  allDisplayValues,
  columns,
  finishedLoading,
  startedGeneratingDisplayValues,
  table
}) =>
  !f.isEmpty(columns) &&
  f.isNil(allDisplayValues[table.id]) &&
  !startedGeneratingDisplayValues &&
  finishedLoading;

const startForTable = ({
  actions: { generateDisplayValues },
  columns,
  langtag,
  rows,
  table
}) => {
  generateDisplayValues(rows, columns, table.id, langtag);
};

export default {
  shouldStartForTable,
  startForTable
};
