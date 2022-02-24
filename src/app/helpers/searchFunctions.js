import f from "lodash/fp";
import { FilterModes } from "../constants/TableauxConstants";

const clean = f.flow(
  f.toLower,
  f.trim
); // normalise string

// TODO: Filternamen in locale speichern, Schema: {filters: {[mode]: display name}}

const SearchFunctions = {
  [FilterModes.CONTAINS]: f.curry((stringOfFilters, str) => {
    return f.every(f.contains(f, clean(str)), f.words(clean(stringOfFilters)));
  }),
  [FilterModes.STATUS]: f.curry((stringOfFilters, shouldContain, str) => {
    return shouldContain ? f.contains(stringOfFilters, str) : !f.contains(stringOfFilters, str)
  }),
  [FilterModes.STARTS_WITH]: f.curry((searchVal, str) => {
    return f.startsWith(clean(searchVal), clean(str));
  })
};

SearchFunctions[FilterModes.CONTAINS].displayName = "table:filter.contains";
SearchFunctions[FilterModes.STARTS_WITH].displayName =
  "table:filter.starts_with";

export const SEARCH_FUNCTION_IDS = [
  FilterModes.CONTAINS,
  FilterModes.STARTS_WITH
];

export default SearchFunctions;
