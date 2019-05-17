import actionTypes from "../actionTypes";
import { makeRequest } from "../../helpers/apiHelper";
import route from "../../helpers/apiRoutes";

const {
  frontendServices: {
    QUERY_FRONTEND_SERVICES,
    FRONTEND_SERVICES_LOADED,
    QUERY_FRONTEND_SERVICES_FAILED
  }
} = actionTypes;

export const queryFrontendServices = () => {
  console.log("query frontend service");
  return {
    promise: makeRequest({
      apiRoute: route.toServiceRegistry()
    }),
    actionTypes: [
      QUERY_FRONTEND_SERVICES,
      FRONTEND_SERVICES_LOADED,
      QUERY_FRONTEND_SERVICES_FAILED
    ]
  };
};
