import f from "lodash/fp";
import { ScopeType } from "../components/frontendService/ServiceConstants";

import actions from "../redux/actionCreators";
import store from "../redux/store";
import { isServiceForColumn, isServiceForTable } from "./frontendServiceHelper";

// fetches from the service registry and writes results to redux store
export const requestAvailableServices = () => {
  store.dispatch(actions.queryFrontendServices());
};

export const filterMainMenuServices = f.compose(
  f.sortBy(f.prop("ordering")),
  f.filter(x => isGlobalService(x))
);

export const filterCellServices = cell => {
  const { table, column } = cell;

  return f.compose(
    f.sortBy(f.prop("ordering")),
    f.filter(
      f.allPass([
        f.propEq("scope.type", ScopeType.cell),
        isServiceForTable(table),
        isServiceForColumn(column)
      ])
    )
  );
};

export const getAllServices = f.prop("frontendServices");
const isGlobalService = f.propEq("scope.type", ScopeType.global);
