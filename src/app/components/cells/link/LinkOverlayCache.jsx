import f from "lodash/fp";
import React, { useMemo } from "react";
import { compose, withHandlers } from "recompose";
import { FilterModes } from "../../../constants/TableauxConstants";
import { makeRequest } from "../../../helpers/apiHelper";
import route from "../../../helpers/apiRoutes";
import { doto, when } from "../../../helpers/functools";
import getDisplayValue from "../../../helpers/getDisplayValue";
import { retrieveTranslation } from "../../../helpers/multiLanguage";
import SearchFunctions from "../../../helpers/searchFunctions";
import { connectOverlayToCellValue } from "../../helperComponents/connectOverlayToCellHOC";

const getLinkedIds = cell => {
  const ids = new Set();
  (cell.value || []).forEach(value => ids.add(value.id));
  console.log({ ids });
  return ids;
};

const withCachedLinks = Component => props => {
  const {
    actions,
    cell,
    cell: { column, table, row },
    grudData,
    langtag,
    unlinkedOrder,
    filterMode = FilterModes.CONTAINS,
    filterValue
  } = props;
  const [foreignRows, setForeignRows] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    fetchForeignRows();
  }, []);

  const maxLinks =
    f.get(["constraint", "cardinality", "to"], column) || Infinity;

  const fetchForeignRows = React.useCallback(() => {
    setLoading(true);
    const apiRoute =
      route.toCell({
        tableId: table.id,
        columnId: column.id,
        rowId: row.id
      }) + "/foreignRows";
    makeRequest({ apiRoute })
      .then(
        // row response -> link label format
        f.compose(
          f.map(({ id, values }) => ({ id, value: f.first(values) })),
          f.prop("rows")
        )
      )
      .then(foreignRows => {
        // update display values in state
        const loadedDisplayValues = foreignRows.map(({ id, value }) => ({
          id,
          values: [getDisplayValue(column.toColumn, value)]
        }));
        actions.addDisplayValues({
          displayValues: [
            { tableId: column.toTable, values: loadedDisplayValues }
          ]
        });
        return foreignRows;
      })
      .then(f.concat(cell.value))
      .then(setForeignRows)
      .then(() => setLoading(false))
      .catch(err => {
        console.error("Error loading foreignRows:", err);
      });
  });

  const dvLookupTable = f.compose(
    f.keyBy("id"),
    f.prop(["displayValues", column.toTable])
  )(grudData);

  const lookupDisplayValue = link =>
    retrieveTranslation(langtag, f.prop([link.id, "values", 0], dvLookupTable));

  const addDisplayValues = link =>
    f.assoc("label", lookupDisplayValue(link), link);

  const linkedIds = getLinkedIds(cell);

  const cacheNewForeignRow = row => {
    const link = addDisplayValues(row);
    setForeignRows([...foreignRows, link]);
  };

  const searchFunction = loading
    ? f.stubTrue
    : el => SearchFunctions[filterMode](filterValue)(el.label);
  const filterFn = f.isEmpty(filterValue) ? f.stubTrue : searchFunction;
  const sortMode = when(f.isNil, f.always(0), unlinkedOrder);
  const sortValue = [f.prop("id"), el => el.label && f.toLower(el.label)][
    sortMode
  ];

  const rowResults = loading
    ? {}
    : doto(
        [...cell.value, ...(cell.value.length < maxLinks ? foreignRows : [])],
        f.uniqBy(f.prop("id")),
        f.map(addDisplayValues),
        f.groupBy(link =>
          f.contains(link.id, linkedIds) ? "linked" : "unlinked"
        ),
        f.update(
          "unlinked",
          f.flow(
            f.filter(filterFn),
            f.sortBy(sortValue)
          )
        )
      );

  return (
    <Component
      {...props}
      loading={loading}
      foreignRows={foreignRows}
      rowResults={rowResults}
      maxLinks={maxLinks}
      fetchForeignRows={fetchForeignRows}
      value={cell.value}
      cacheNewForeignRow={cacheNewForeignRow}
    />
  );
};

export default compose(
  withHandlers({
    setFilterValue: ({ id, actions, filterMode }) => filterValue =>
      actions.setOverlayState({ id, filterValue, filterMode }),
    setFilterMode: ({ id, actions, filterValue }) => filterMode =>
      actions.setOverlayState({ id, filterValue, filterMode }),
    setUnlinkedOrder: ({ id, actions }) => unlinkedOrder =>
      actions.setOverlayState({ id, unlinkedOrder })
  }),
  connectOverlayToCellValue,
  withCachedLinks
);
