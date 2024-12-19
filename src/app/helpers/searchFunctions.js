import f from "lodash/fp";
import { ColumnKinds, FilterModes } from "../constants/TableauxConstants";

const TaggedFunction = (mode, displayName, fn, isValidColumn = () => true) => {
  const taggedFn = function(...args) {
    return fn(...args);
  };
  taggedFn.mode = mode;
  taggedFn.displayName = displayName;
  taggedFn.isValidColumn = isValidColumn;
  return taggedFn;
};

const DEFAULT_FILTER_MODE = FilterModes.CONTAINS;

const clean = f.flow(
  f.toLower,
  f.trim
); // normalise string

const SearchFunctions = {
  [FilterModes.CONTAINS]: TaggedFunction(
    FilterModes.CONTAINS,
    "table:filter.contains",
    f.curry((stringOfFilters, str) => {
      return f.every(
        f.contains(f, clean(str)),
        f.words(clean(stringOfFilters))
      );
    })
  ),
  [FilterModes.STARTS_WITH]: TaggedFunction(
    FilterModes.STARTS_WITH,
    "table:filter.starts_with",
    f.curry((searchVal, str) => {
      return f.startsWith(clean(searchVal), clean(str));
    })
  ),
  [FilterModes.IS_EMPTY]: TaggedFunction(
    FilterModes.IS_EMPTY,
    "table:filter.is_empty",
    f.curry((_, value) => {
      const isEmptyValue = f.cond([
        [f.isNumber, f.isNaN],
        [Array.isArray, f.isEmpty],
        [f.isPlainObject, f.isEmpty],
        [f.isString, f.isEmpty],
        [f.isBoolean, f.isNil],
        [f.stubTrue, f.isNil]
      ]);
      return isEmptyValue(value);
    })
  )
};

export const StatusSearchFunction = TaggedFunction(
  FilterModes.STATUS,
  "Status",
  f.curry((stringOfFilters, shouldContain, str) => {
    const filterWords = f.words(clean(stringOfFilters));
    const cleanedInput = clean(str);
    const isInInput = f.contains(f.__, cleanedInput);
    return shouldContain
      ? f.every(isInInput, filterWords)
      : !f.some(isInInput, filterWords);
  }),
  column => column.kind === ColumnKinds.status
);

export const SEARCH_FUNCTION_IDS = Object.keys(SearchFunctions);

const allFilters = [...Object.values(SearchFunctions), StatusSearchFunction];
export const canColumnBeSearched = column =>
  allFilters.some(filter => filter.isValidColumn(column));
export const getFiltersForColumn = column =>
  allFilters.filter(filter => filter.isValidColumn(column));
export const getSearchFunction = mode =>
  f.cond([
    [f.eq(FilterModes.STATUS), () => StatusSearchFunction],
    [f.contains(f.__, SEARCH_FUNCTION_IDS), () => SearchFunctions[mode]]
  ])(mode);

export const createTextFilter = (mode, value) => {
  switch (true) {
    case f.isNil(mode):
      return createTextFilter(DEFAULT_FILTER_MODE, value);
    case f.values(FilterModes).includes(mode):
      return SearchFunctions[mode](value);
    default:
      throw new Error(`Unknown search mode: ${mode}`);
  }
};

export default SearchFunctions;
