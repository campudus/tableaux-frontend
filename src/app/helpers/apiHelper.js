import {apiHost, apiPort} from "../conf.js";
import request from "superagent";

const buildURL = apiRoute => apiHost + apiPort +  "/api" + apiRoute;

export const makeRequest = ({apiRoute, type, params}) => {
  const url = buildURL(apiRoute);
  console.log(url);
  switch (type) {
    case "GET":
      return request.get(url).then(result => result.body);
    default:
      return null;
  }
};
