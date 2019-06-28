import f from "lodash/fp";

import actions from "../redux/actionCreators";
import store from "../redux/store";

// fetches from the service registry and writes results to redux store
export const requestAvailableServices = () => {
  store.dispatch(actions.queryFrontendServices());
};

export const filterMainMenuEntries = f.compose(
  f.sortBy(f.prop("ordering")),
  f.filter(isGlobalService)
);

export const getMainMenuEntryServices = () =>
  f.compose(
    filterMainMenuEntries,
    getServiceArray
  )(store.getState());

const getServiceArray = f.prop("frontendServices");
const isGlobalService = f.propEq(["scope", "type"], "global");
