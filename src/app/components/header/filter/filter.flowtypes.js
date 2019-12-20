import f from "lodash/fp";

import type { ColumnId } from "../../../redux/redux.flowtypes";
import { ColumnKinds, FilterModes } from "../../../constants/TableauxConstants";
import SearchFunctions from "../../../helpers/searchFunctions";

export const SearchModes = f.keys(SearchFunctions);

export const FilterTypes = {
  BOOL: "boolean",
  TEXT: "text"
};

export type FilterKind = $Values<typeof FilterTypes>;
export type FilterMode = $Values<typeof FilterModes>;
export type FilterValue = string | boolean;

export type Filter = {
  label: string,
  value: FilterValue,
  mode: FilterMode,
  columnId: ColumnId,
  columnKind: $Values<ColumnKinds>,
  kind: FilterKind,
  isDisabled?: boolean,
  idx?: number
};

export type ApplicableFilter = {
  columnId: ColumnId,
  mode: FilterMode,
  value: FilterValue,
  columnKind: $Values<ColumnKinds>
};

export type SortingDirection = "ASC" | "DESC";

export type Sorting = {
  columnId: ColumnId,
  value: SortingDirection
};
