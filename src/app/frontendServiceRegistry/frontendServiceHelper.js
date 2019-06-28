import f from "lodash/fp";

import { replaceMoustache } from "../helpers/functools";

export const expandServiceUrl = f.curryN(2, (values, serviceUrl) => {
  const replace = replaceMoustache(values || {});
  const moustaches = f.keys(values);
  return moustaches.reduce(
    (url, moustache) => replace(moustache, url),
    serviceUrl
  );
});
