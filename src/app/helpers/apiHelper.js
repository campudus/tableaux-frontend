import { apiHost, apiPort } from "../conf.js";
import "cross-fetch/polyfill";
import { isNil } from "lodash/fp";
import apiUrl from "./apiUrl";


const buildURL = apiRoute => "http://10.10.2.120:" + apiPort + apiUrl(apiRoute);

const makeRequest = ({
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

const sendTestData = path =>data =>
  fetch("http://localhost:3004", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({data,path})
  }).then(response => console.log(response));

export {makeRequest,sendTestData}
