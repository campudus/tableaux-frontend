import { ColumnKinds } from "../constants/TableauxConstants";
import Text from "./Text";

const Mode = {
  contains: "contains"
};

const filterableColumnKinds = new Set([
  ColumnKinds.attachment,
  ColumnKinds.concat,
  ColumnKinds.date,
  ColumnKinds.dateTime,
  ColumnKinds.group,
  ColumnKinds.integer,
  ColumnKinds.link,
  ColumnKinds.numeric,
  ColumnKinds.richtext,
  ColumnKinds.shorttext,
  ColumnKinds.text
]);

// We use `getDisplayValue`, so we can nly use strings
export default {
  Mode,
  readValue: Text.readValue,
  [Mode.contains]: (ctx, query) => {
    const pred = Text.contains(query);
    return (row, _, columnMatches) => {
      const findMatchingRows = (found, column) => {
        const dv =
          column.kind === "link"
            ? ctx.getValue(column.name)(row)
            : ctx.getDisplayValue(column.name, row);
        if (
          filterableColumnKinds.has(column.kind) &&
          pred(Array.isArray(dv) ? dv.join(" ") : dv)
        ) {
          columnMatches.get().add(column.id);
          return true;
        } else {
          return found;
        }
      };
      return ctx.columns.reduce(findMatchingRows, false);
    };
  }
};
