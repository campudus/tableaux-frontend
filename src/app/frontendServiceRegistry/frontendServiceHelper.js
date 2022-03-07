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

const checkAsRegExp = (reString, value) => new RegExp(reString).test(value);

const allMatch = (constraint, element) =>
  f.keys(constraint).reduce((allowed, key) => {
    const check = constraint[key];
    const value = f.prop(key, element);

    return allowed && checkAsRegExp(check, value);
  }, true);

const anyMatches = (constraint, element) =>
  f.keys(constraint).reduce((matches, key) => {
    const check = constraint[key];
    const value = f.prop(key, element);

    return matches || checkAsRegExp(check, value);
  }, false);

export const isServiceAllowed = (constraint, element) => {
  const { includes, excludes } = constraint;
  if (includes || excludes) {
    return allMatch(includes, element) && !anyMatches(excludes, element);
  } else {
    return allMatch(constraint, element);
  }
};

export const isServiceForTable = f.curryN(2, (table, service) => {
  const tableConstraint = f.prop("scope.tables", service);
  return tableConstraint ? isServiceAllowed(tableConstraint, table) : true;
});

export const isServiceForColumn = f.curryN(2, (column, service) => {
  const columnConstraint = f.prop("scope.columns", service);
  return columnConstraint ? isServiceAllowed(columnConstraint, column) : true;
});
