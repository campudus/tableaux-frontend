import f from "lodash/fp";
import { ColumnKinds, FilterModes } from "../constants/TableauxConstants";

const TaggedFunction = (displayName, fn, isValidColumn = () => true) => {
  const taggedFn = function(...args) {
    return fn(...args);
  };
  (taggedFn.displayName = displayName),
    (taggedFn.isValidColumn = isValidColumn);
  return taggedFn;
};

const DEFAULT_FILTER_MODE = FilterModes.CONTAINS;

const clean = f.flow(
  f.toLower,
  f.trim
); // normalise string

const SearchFunctions = {
  [FilterModes.CONTAINS]: TaggedFunction(
    "table:filter.contains",
    f.curry((stringOfFilters, str) => {
      return f.every(
        f.contains(f, clean(str)),
        f.words(clean(stringOfFilters))
      );
    })
  ),
  [FilterModes.STARTS_WITH]: TaggedFunction(
    "table:filter.starts_with",
    f.curry((searchVal, str) => {
      return f.startsWith(clean(searchVal), clean(str));
    })
  ),
  [FilterModes.IS_EMPTY]: TaggedFunction(
    "table:filter.is_empty",
    f.curry((_, value) => {
      const isEmptyValue = f.cond([
        [f.isNumber, f.isNaN],
        [Array.isArray, f.isEmpty],
        [f.isPlainObject, f.isEmpty],
        [f.stubTrue, x => !Boolean(x)]
      ]);
      return isEmptyValue(value);
    })
  )
};

export const StatusSearchFunction = TaggedFunction(
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

export const SEARCH_FUNCTION_IDS = [
  FilterModes.CONTAINS,
  FilterModes.STARTS_WITH,
  FilterModes.IS_EMPTY
];

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
