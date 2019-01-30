import { apiHost, apiPort } from "../conf.js";
import fetch from "cross-fetch";
import f from "lodash/fp";
import apiUrl from "./apiUrl";
import { doto } from "./functools.js";


const buildURL = apiRoute => apiHost + apiPort + apiUrl(apiRoute);

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

const makeRequest = async ({
  apiRoute,
  method = "GET",
  params,
  data,
  responseType = "JSON"
}) => {
  const url = buildURL(apiRoute) + paramsToString(params);
  console.log("apiHelper", method.toUpperCase(), url);
  const parseResponse = response => response[responseType.toLowerCase()]();
  return fetch(url, {
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

const sendTestData = path =>fileName =>data =>
  fetch("http://localhost:3004", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({data,path:path+fileName})
  }).then(response => console.log(response));

export {makeRequest,sendTestData};
