import store from "../redux/store";
import actions from "../redux/actionCreators";

// fetches from the service registry and writes results to redux store
export const requestAvailableServices = () => {
  store.dispatch(actions.queryFrontendServices());
};
