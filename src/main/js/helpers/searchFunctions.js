import * as f from "lodash/fp";
import {FilterModes} from "../constants/TableauxConstants";

const SearchFunctions = {
  [FilterModes.CONTAINS]: f.curry(
    (stringOfFilters, str) => {
      const fcontains = a => b => f.contains(b)(a);
      return f.every(
        fcontains(f.toLower(str)),
        f.words(stringOfFilters))
    }),
  [FilterModes.STARTS_WITH]: f.curry(
    (searchVal, str) => {
      return f.startWith(searchVal, str);
    })
};

export default SearchFunctions;