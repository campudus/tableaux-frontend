import { match, otherwise, when } from "match-iz";
import f from "lodash/fp";

export const toCombinedFilter = settings => {
  const validSettings = settings;

  const combined = match(validSettings.length)(
    when(0, []),
    when(1, f.first(validSettings)),
    otherwise(["and", ...validSettings])
  );
  return combined;
};

export const fromCombinedFilter = columns => {
  const columnLookup = f.indexBy("name", columns);
  const filterToSetting = filter => {
    const [kind, ...rest] = filter;
    return match(kind)(
      when("value", () => {
        const [colName, mode, value] = rest;
        return { column: columnLookup[colName], mode, value };
      }),
      when("and", () =>
        f.compact(
          rest.reduce((acc, next) => [...acc, filterToSetting(next)], [])
        )
      ),
      otherwise(() => undefined)
    );
  };
  return filterToSetting;
};
