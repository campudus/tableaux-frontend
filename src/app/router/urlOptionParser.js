import { doto, merge } from "../helpers/functools";
import f from "lodash/fp";

const parseOptions = optString => {
  if (!optString || f.isEmpty(optString)) {
    return {};
  }
  const opts = (optString[0] === "?"
    ? optString.substring(1)
    : optString
  ).split("&");

  const mergeOptions = (opts, moreOpts) =>
    f.contains("filter", f.keys(moreOpts))
      ? f.update(
          "filter",
          oldFilters =>
            oldFilters
              ? oldFilters[0] === "and"
                ? [...oldFilters, moreOpts.filter ?? []]
                : ["and", ...oldFilters, moreOpts.filter ?? []]
              : moreOpts.filter ?? [],
          opts
        )
      : merge(opts, moreOpts);

  const parseFilter = function(str) {
    const toFilter = x => ({
      filter: x
    });
    const [modeStr, ...params] = doto(str, f.split(":"), f.tail);

    if (!f.isNil(modeStr)) {
      if (modeStr === "id") {
        return toFilter([
          "or",
          ...(params || [])
            .map(f.toNumber)
            .map(id => ["value", "rowId", "equals", id])
        ]);
      } else if (modeStr === "flag")
        return toFilter(["annotation", "flag", params[0], "is-set"]);
      else return toFilter([modeStr, ...params]);
    } else return toFilter([]);
  }; // will get more complex once we implement filter routes

  const parseEntityView = function(str) {
    return { entityView: { focusElement: str.split(":").length > 1 } };
  };

  const getOptions = f.cond([
    [f.startsWith("filter"), parseFilter],
    [f.startsWith("details"), parseEntityView]
  ]);

  return (opts || [])
    .map(getOptions)
    .filter(f.complement(f.isEmpty))
    .reduce(mergeOptions, {});
};

export default parseOptions;
