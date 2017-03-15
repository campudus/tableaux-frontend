import * as f from "lodash/fp";
import {FilterModes} from "../constants/TableauxConstants";

const clean = f.compose(f.toLower, f.trim); // normalise string

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

export default SearchFunctions;
