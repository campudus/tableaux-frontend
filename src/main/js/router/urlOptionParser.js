import {doto, spy} from "../helpers/functools";
import {FilterModes} from "../constants/TableauxConstants";
import f from "lodash/fp";

const parseOptions = optString => {
  if (!optString || f.isEmpty(optString)) {
    console.log("no URL options")
    return {};
  }
  const opts = ((optString[0] === "?") ? optString.substring(1) : optString).split("&");

  const parseFilter = function (str) {
    const [modeStr, ...params] = doto(str, f.split(":"), f.tail);
    console.log("parsing filter String", str, "->", modeStr, params);

    if (!f.isNil(modeStr)) {
      if (modeStr === "id") {
        return {
          filter: {
            mode: FilterModes.ID_ONLY,
            value: f.map(f.toNumber, params)
          }
        };
      } else if (modeStr === "flags") {
        return {
          filter: {
            mode: f.first(params),
            value: true
          }
        };
      }
    } else {
      return {filter: true};
    }
  }; // will get more complex once we implement filter routes

  const parseEntityView = function (str) {
    return {entityView: {focusElement: str.split(":").length > 1}};
  };

  f.map(console.log, opts)

  const getOptions = f.cond([
    [f.startsWith("filter"), parseFilter],
    [f.startsWith("details"), parseEntityView]
  ]);

  return spy(f.reduce(f.merge, {}, f.map(getOptions, opts)), "URL options");
};

export default parseOptions;
