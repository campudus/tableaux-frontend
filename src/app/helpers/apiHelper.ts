import f from "lodash/fp";
import fetch from "cross-fetch";
import superagent, { ProgressEvent } from "superagent";
import { getLogin, noAuthNeeded } from "./authenticate";
import apiUrl, { UrlProps } from "./apiUrl";

type RequestParams = {
  url?: string;
  apiRoute?: string | UrlProps;
  method?: string;
  params?: Record<string, string>;
  data?: unknown;
  body?: unknown;
  responseType?: "json" | "text";
  file?: File;
  onProgress?: (progress: ProgressEvent) => void;
};

/**
 * Make a promisified cross-browser-compatible XHR-request, using
 * browser fetch-API or a polyfill
 **/
export const makeRequest = async ({
  url,
  apiRoute,
  method = "GET",
  params,
  data,
  responseType = "json",
  file,
  onProgress = f.noop
}: RequestParams) => {
  const baseUrl = f.isString(apiRoute) ? apiUrl(apiRoute) : url;
  const paramsString = new URLSearchParams(params).toString();
  const targetUrl = baseUrl + paramsString ? `?${paramsString}` : "";
  const isGet = /get/i.test(method);
  const handler = !isGet && (onProgress || file) ? "superagent" : "cross-fetch";
  const body = f.isNil(data) ? undefined : JSON.stringify(data);
  const authToken = "Bearer " + getLogin().token;
  const authHeader = noAuthNeeded() ? "disabled-for-dev-mode" : authToken;

  if (import.meta.env.NODE_ENV !== "production") {
    console.log([handler, method, targetUrl].join(" "));
  }

  if (handler === "superagent") {
    return new Promise((resolve, reject) => {
      superagent(method, targetUrl)
        .set("Authorization", authHeader)
        .on("progress", onProgress)
        // @ts-expect-error should accept file
        .attach("file", file, file.name)
        .end((err, res) => (err ? reject(err) : resolve(res)));
    });
  } else {
    return fetch(targetUrl, {
      method,
      body,
      headers: { Authorization: authHeader }
    })
      .then(response => {
        if (!response.ok) {
          throw new Error(`Request error: ${targetUrl}: ${response.status}`);
        } else {
          return response;
        }
      })
      .then(response => {
        return responseType.toLowerCase() === "text"
          ? response.text()
          : response.json();
      });
  }
};
