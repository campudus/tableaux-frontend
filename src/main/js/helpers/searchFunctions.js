import * as f from "lodash/fp";
import {FilterModes} from "../constants/TableauxConstants";

const clean = f.compose(f.toLower, f.trim); // normalise string

// TODO: Filternamen in locale speichern, Schema: {filters: {[mode]: display name}}

const SearchFunctions = {
  [FilterModes.CONTAINS]: f.curry(
    (stringOfFilters, str) => {
      const fcontains = a => b => f.contains(b)(a);
      return f.every(
        fcontains(clean(str)),
        f.words(clean(stringOfFilters)));
    }),
  [FilterModes.STARTS_WITH]: f.curry(
    (searchVal, str) => {
      return f.startsWith(clean(searchVal), clean(str));
    })
};

SearchFunctions[FilterModes.CONTAINS].displayName = "table:filter.contains";
SearchFunctions[FilterModes.STARTS_WITH].displayName = "table:filter.starts_with";

export const SEARCH_FUNCTION_IDS = [FilterModes.CONTAINS, FilterModes.STARTS_WITH];

export default SearchFunctions;
