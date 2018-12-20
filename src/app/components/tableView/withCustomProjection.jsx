/**
 * This HOC will watch our TableView's properties and set column- and row-projections properly.
 * Whenever a table gets loaded
 * 1) persisted projections from localStorage get applied if found
 * 2) if filters are requested by url options, they override the persisted projections
 * 3) handlers "setFilter" and "setColumnVisibility" get added to TableView, allowing to override the
 *    current projection on runtime. The update methods will automatically persist new projections
 *    by default
 * The final, current projection gets passed as a prop to TableView. TableView is responsible for
 * applying the requested projection to the displayed rows and columns.
 */

import {compose, mapProps, withStateHandlers} from "recompose";
import {either} from "../../helpers/functools";
import f from "lodash/fp";
import {FilterModes, Langtags} from "../../constants/TableauxConstants";

const getStoredViewObject = (tableId = null, name = "default") => {
  if (tableId) {
    return either(localStorage)
      .map(f.get("tableViews"))
      .map(JSON.parse)
      .map(f.get([tableId.toString(), name]))
      .getOrElse(null);
  } else {
    return either(localStorage)
      .map(f.get("tableViews"))
      .map(JSON.parse)
      .getOrElse({});
  }
};

// ({table: Table model}) -> props object with "projection" object from localStorage added
const loadProjection = (props) => {
  const { tableId } = props;
  const storedViewObject = getStoredViewObject(tableId);
  const storedColumnView = f.get("visibleColumns", storedViewObject);
  const storedRowsFilter = f.get("rowsFilter", storedViewObject) || {};

  return f.assoc(
    "projection",
    {
      columns: storedColumnView,
      rows: storedRowsFilter
    },
    props
  );
};

// ({urlOptions: object, projections: object}) -> props object with "projection" object replaced by
//       filter defined by urlOptions
const parseUrlFilterProp = (props) => {
  const filters = f.get(["urlOptions", "filter"], props);
  if (f.isEmpty(filters)) {
    return props;
  }

  const primaryLangAsksForTranslation = (filter = {}) => (
    filter.mode === FilterModes.UNTRANSLATED && props.langtag === f.first(Langtags)
  );

  const checkFilter = f.cond([
    [f.eq(true), f.always({mode: FilterModes.ID_ONLY, value: [props.rowId]})],
    [primaryLangAsksForTranslation, f.assoc("mode", FilterModes.ANY_UNTRANSLATED)],
    [f.stubTrue, f.identity]
  ]);

  return f.assoc(
    ["projection", "rows", "filters"],
    f.map(checkFilter, filters),
    props
  );
};

const saveFilterSettings = (tableId, settings = {}, name = "default") => {
  if (!localStorage) {
    return;
  }

  const savedViews = getStoredViewObject(null, name);
  const newViewsObj = f.set([tableId, name, "rowsFilter"], settings, savedViews);
  localStorage["tableViews"] = JSON.stringify(newViewsObj);
};

const updateFilter = (tableId, state, settings = {}, shouldSave) => {
  const {filters = [], sorting = {}} = settings;
  const isFilterEmpty = filter => f.isEmpty(filter.value) && !f.isString(filter.mode);
  const isSortingEmpty = !f.isFinite(sorting.columnId) && f.isEmpty(sorting.value);
  const areAllFiltersEmpty = f.isEmpty(filters) || f.every(isFilterEmpty, filters);

  if (areAllFiltersEmpty && isSortingEmpty) {
    if (shouldSave) {
      saveFilterSettings(tableId, {});
    }
    
    return f.assoc(
      ["projection", "rows"],
      {},
      state
    );
  } else {
    const rowsFilter = {
      sortColumnId: sorting.columnId,
      sortValue: sorting.value,
      filters: f.reject(isFilterEmpty, filters)
    };

    if (shouldSave) {
      saveFilterSettings(tableId, rowsFilter);
    }

    return f.assoc(
      ["projection", "rows"],
      rowsFilter,
      state
    );
  }
};

const saveColumnVisibility = (tableId, view, name = "default") => {
  if (!localStorage) {
    return;
  }
  const savedViews = getStoredViewObject(null, name);
  localStorage["tableViews"] = JSON.stringify(f.set([tableId, name, "visibleColumns"], view, savedViews));
};

const updateColumnVisibility = (tableId, state, {val, colIds}, shouldSave) => {
  const currentVisibility = f.get(["projection", "columns"], state) || [];
  const visibility = (f.isNil(colIds))
    ? [] // no colIds given -> clear all
    : (val)
      ? f.uniq([...currentVisibility, ...colIds]) // val == truthy -> add colIds to visibility array
      : f.without(colIds, currentVisibility); // else remove colIds from visibility array
  
  if (shouldSave && !f.equals(visibility, currentVisibility)) {
    saveColumnVisibility(tableId, visibility);
  }
  
  return f.assoc(
    ["projection", "columns"],
    visibility,
    state
  );
};

const withPredefinedProjection = compose(
  // make sure we parse all options and trigger a re-render on table switch
  mapProps(loadProjection),
  mapProps(parseUrlFilterProp),
  // add function props to modify session's projection on user input
  withStateHandlers(
    ({projection = {}}) => ({projection}),
    {
      setFilter: (state, {table: {id}}) => (filter, shouldSave = true) => updateFilter(id, state, filter, shouldSave),
      setColumnVisibility: (state, {table: {id}}) => (info, shouldSave = true) => updateColumnVisibility(
        id,
        state,
        info,
        shouldSave
      ),
      resetStoredProjection: (_, {projection}) => f.assoc("projection", projection)
    },
  ),
);

export default withPredefinedProjection;
