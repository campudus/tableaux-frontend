import { apiHost, apiPort } from "../conf.js";
import fetch from "cross-fetch";
import { isNil } from "lodash/fp";
import apiUrl from "./apiUrl";

const buildURL = apiRoute => apiHost + apiPort + apiUrl(apiRoute);

export const makeRequest = ({
  apiRoute,
  method = "GET",
  //  params,
  data,
  responseType = "JSON"
}) => {
  const url = buildURL(apiRoute);
  const parseResponse = response => response[responseType.toLowerCase()]();
  return fetch(url, {
    method,
    body: isNil(data) ? undefined : JSON.stringify(data)
  })
    .then(parseResponse)
    .catch(error => String(error));
};
