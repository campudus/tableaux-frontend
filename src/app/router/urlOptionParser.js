import { doto, merge } from "../helpers/functools";
import { FilterModes } from "../constants/TableauxConstants";
import f from "lodash/fp";

const parseOptions = optString => {
  if (!optString || f.isEmpty(optString)) {
    return {};
  }
  const opts = (optString[0] === "?"
    ? optString.substring(1)
    : optString
  ).split("&");

  const mergeOptions = (opts, moreOpts) => {
    return f.contains("filter", f.keys(moreOpts))
      ? f.update(
          "filter",
          (oldFilters = []) => [...oldFilters, f.get("filter", moreOpts)],
          opts
        )
      : merge(opts, moreOpts);
  };

  const parseFilter = function(str) {
    const [modeStr, ...params] = doto(str, f.split(":"), f.tail);

    if (!f.isNil(modeStr)) {
      if (modeStr === "id") {
        return {
          filter: {
            mode: FilterModes.ID_ONLY,
            value: f.map(f.toNumber, params)
          }
        };
      } else if (modeStr === "flag") {
        return {
          filter: {
            mode: doto(params, f.first, getFilterMode),
            columnKind: "boolean",
            value: true
          }
        };
      }
    } else {
      return { filter: true };
    }
  }; // will get more complex once we implement filter routes

  const parseEntityView = function(str) {
    return { entityView: { focusElement: str.split(":").length > 1 } };
  };

  const getOptions = f.cond([
    [f.startsWith("filter"), parseFilter],
    [f.startsWith("details"), parseEntityView]
  ]);

  return f.reduce(mergeOptions, {}, f.map(getOptions, opts));
};

const getFilterMode = flag =>
  f.get(flag, {
    "needs-translation": FilterModes.UNTRANSLATED,
    "check-me": FilterModes.CHECK_ME,
    comments: FilterModes.WITH_COMMENT,
    postpone: FilterModes.POSTPONE,
    important: FilterModes.IMPORTANT,
    final: FilterModes.FINAL
  });

export default parseOptions;
