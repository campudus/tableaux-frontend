import { apiHost, apiPort } from "../conf.js";
import fetch from "cross-fetch";
import f from "lodash/fp";
import apiUrl from "./apiUrl";
import { doto } from "./functools.js";
import API_ROUTES from "./apiRoutes";

const buildURL = apiRoute => apiUrl(apiRoute);

const paramsToString = params =>
  f.isEmpty(params)
    ? ""
    : doto(
        params,
        f.toPairs,
        f.map(([param, value]) =>
          f.isArray(value)
            ? value.map(v => `${param}=${v}`).join("&")
            : `${param}=${value}`
        ),
        f.join("&"),
        f.concat("?"),
        f.join("")
      );

/**
 * Make a promisified cross-browser-compatible XHR-request, using
 * browser fetch-API or a polyfill
 *
 * @param {apiRoute?: string} Fetch route relative to app's api
 * @param {url?: string} Fetch url directly, without api prefix
 * @param {method?: string = "GET"}
 * @param {data?: any} Request body data, must be JSON.stringify-able
 * @param {responseType?: string = "JSON"} One of ["json", "text"]
 * @returns Promise<:responseType>
 **/
export const makeRequest = async ({
  url,
  apiRoute,
  method = "GET",
  params,
  data,
  responseType = "JSON"
}) => {
  const targetUrl =
    (f.isString(apiRoute) ? buildURL(apiRoute) : url) + paramsToString(params);
  const parseResponse = response => response[responseType.toLowerCase()]();
  return fetch(targetUrl, {
    method,
    body: f.isNil(data) ? undefined : JSON.stringify(data)
  })
    .then(response => {
      if (!response.ok) {
        throw new Error(`Request error: ${url}: ${response.statusName}`);
      } else {
        return response;
      }
    })
    .then(parseResponse);
};


const sendTestData = path => fileName => data =>
  fetch("http://localhost:3004", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ data, path: path + fileName })
  }).then(response => console.log(response));
