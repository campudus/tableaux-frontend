import f from "lodash/fp";
import fetch from "cross-fetch";
import request from "superagent";

import { NO_AUTH_IN_DEV_MODE } from "../FeatureFlags";
import { doto } from "./functools.js";
import { getLogin } from "./authenticate";
import apiUrl from "./apiUrl";

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
 * @param {body?: any} Request body to send as-is
 * @param {responseType?: string = "JSON"} One of ["json", "text"]
 * @returns Promise<:responseType>
 **/
export const makeRequest = async ({
  url,
  apiRoute,
  method = "GET",
  params,
  data,
  responseType = "JSON",
  file,
  onProgress
}) => {
  const targetUrl =
    (f.isString(apiRoute) ? buildURL(apiRoute) : url) + paramsToString(params);

  const needsSuperagentRequest =
    method.toLowerCase() !== "get" && (onProgress || file);
  const body = f.isNil(data) ? undefined : JSON.stringify(data);

  const fetchMethod = logDevRoute(
    needsSuperagentRequest ? superagentRequest : fetchRequest
  );
  return fetchMethod({
    method,
    targetUrl,
    body,
    file,
    onProgress,
    responseType
  });
};

const calcAuthHeader = () =>
  process.env.NODE_ENV === "development" && NO_AUTH_IN_DEV_MODE
    ? "disabled-for-dev-mode"
    : "Bearer " + getLogin().token;

const fetchRequest = ({ method, targetUrl, body, responseType }) => {
  const parseResponse = response => response[responseType.toLowerCase()]();
  return fetch(targetUrl, {
    method,
    body,
    headers: { Authorization: calcAuthHeader() }
  })
    .then(response => {
      if (!response.ok) {
        throw new Error(`Request error: ${targetUrl}: ${response.statusName}`);
      } else {
        return response;
      }
    })
    .then(parseResponse);
};

// fetch-API does not yet support progress
const superagentRequest = ({ method, targetUrl, file, onProgress }) =>
  new Promise((resolve, reject) => {
    request[method.toLowerCase()](targetUrl)
      .set("Authorization", calcAuthHeader())
      .on("progress", progress => onProgress && onProgress(progress))
      .attach("file", file, file.name)
      .end((err, response) => {
        if (err) {
          return reject(err);
        } else {
          resolve(response);
        }
      });
  });

const logDevRoute = fetchFn => {
  if (process.env.NODE_ENV !== "production") {
    return fetchParams => {
      console.log(
        `(${fetchFn.name}) ${fetchParams.method.toUpperCase()} ${
          fetchParams.targetUrl
        }`
      );
      return fetchFn(fetchParams);
    };
  } else {
    return fetchFn;
  }
};
