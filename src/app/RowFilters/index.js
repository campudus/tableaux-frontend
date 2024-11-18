import f from "lodash/fp";
import { ColumnKinds } from "../constants/TableauxConstants";
import FilterBoolean from "./Boolean";
import FilterDate from "./Date";
import FilterDateTime from "./DateTime";
import FilterNumber from "./Number";
import FilterText from "./Text";
import FilterRowProp from "./RowProp";

export const Boolean = FilterBoolean.Mode;
export const Date = FilterDate.Mode;
export const DateTime = FilterDateTime.Mode;
export const Number = FilterNumber.Mode;
export const Text = FilterText.Mode;
export const RowProp = FilterRowProp.Mode;

const ModesForKind = {
  [ColumnKinds.attachment]: null,
  [ColumnKinds.boolean]: FilterBoolean,
  [ColumnKinds.concat]: null,
  [ColumnKinds.currency]: null,
  [ColumnKinds.date]: FilterDate,
  [ColumnKinds.datetime]: FilterDateTime,
  [ColumnKinds.group]: null,
  [ColumnKinds.integer]: FilterNumber,
  [ColumnKinds.link]: FilterText,
  [ColumnKinds.numeric]: FilterNumber,
  [ColumnKinds.richtext]: FilterText,
  [ColumnKinds.shorttext]: FilterText,
  [ColumnKinds.status]: null,
  [ColumnKinds.text]: FilterText
};

const filterableColumnKinds = new Set(
  Object.keys(ModesForKind).filter(key => ModesForKind[key])
);

const canFilterByColumnKind = filterableColumnKinds.has;

const canSortByColumnKind = kind => {
  const filterModes = ModesForKind[kind];
  return (
    filterModes &&
    typeof filterModes.lt === "function" &&
    typeof filterModes.empty === "function"
  );
};

/*
 * Parses filter expressions according to the following BNF from Arrays
 * (commas omitted for legibility):
 *
 * Filter         := [ValuePredicate | And | Or]
 * ValuePredicate := ["value" ColumnName Operator] | ["value" ColumnName Operator OperatorValue]
 * And            := ["and" Filter+]
 * Or             := ["or" Filter+]
 *
 * With `ColumnName`s being obvious and `Operator`s from filters matching the column type.
 * Some operators may require an additional operator value `["value", "year", "equals", 2024]`,
 * while other operators don't `["value", "year", "is-not-empty"]`
 *
 * Produces Row -> Boolean
 */
const parse = ctx => {
  const parseImpl = list => {
    const [kind, ...args] = list;
    switch (kind) {
      case "and":
        return row =>
          args.reduce((match, arg) => match && parseImpl(arg)(row), true);
      case "or":
        return row =>
          args.reduce((match, arg) => match || parseImpl(arg)(row), false);
      case "value":
        return parseValueFilter(ctx, list);
      case "row-prop":
        return parseRowPropFilter(list);
      default:
        throw new Error(`Could not parse filter instruction of kind ${kind}`);
    }
  };
  return parseImpl;
};

const parseValueFilter = (ctx, [_, colName, op, query]) => {
  const getValue = ctx.getValue(colName);
  const filter = ctx.getValueFilter(colName, op, query);
  return row => filter(getValue(row));
};

const parseRowPropFilter = ([_, path, op, query]) => {
  if (!FilterRowProp[op]) {
    throw new Error(`Unknown comparison ${op} for row properties`);
  } else {
    return FilterRowProp[op](path, query);
  }
};

const buildIdxLookup = (propName, elements) =>
  elements.reduce((accum, el, idx) => {
    const key = el[propName];
    accum[key] = idx;
    return accum;
  }, {});

const buildContext = (tableId, langtag, store) => {
  const columns = store.columns[tableId].data ?? [];
  const columnIdxLookup = buildIdxLookup("name", columns);
  const columnKindLookup = columns.reduce((acc, { name, kind }) => {
    acc[name] = kind;
    return acc;
  }, {});
  const rows = store.rows[tableId].data ?? [];
  const displayValues = store.tableView.displayValues[tableId];
  const rowIdxLookup = buildIdxLookup("id", rows);

  const getDisplayValueEntry = (name, row) => {
    const rowIdx = rowIdxLookup[row.id];
    const colIdx = columnIdxLookup[name];
    return displayValues[rowIdx].values[colIdx];
  };

  const retrieveDisplayValue = name => row =>
    getDisplayValueEntry(name, row)[langtag];

  const retrieveLinkDisplayValue = name => row => {
    const dvDefinition = getDisplayValueEntry(name, row);
    const toTableId = dvDefinition.tableId;
    const rowIds = new Set(dvDefinition.rowIds);
    // TODO: use lookup instead
    const linkedDisplayValues = f.compose(
      f.map(langtag),
      f.flatMap("values"),
      f.filter(({ id }) => rowIds.has(id)),
      f.get(`tableView.displayValues.${toTableId}`)
    )(store);
    return linkedDisplayValues.join(" ");
  };

  const retrieveRawValue = name => row => {
    const rowIdx = rowIdxLookup[row.id];
    const colIdx = columnIdxLookup[name];
    const rawValue = rows[rowIdx].values[colIdx];
    return typeof rawValue === "object" &&
      rawValue !== null &&
      !Array.isArray(rawValue)
      ? rawValue[langtag]
      : rawValue;
  };

  const lookupFn = {
    [ColumnKinds.boolean]: retrieveRawValue,
    [ColumnKinds.date]: retrieveRawValue,
    [ColumnKinds.datetime]: retrieveRawValue,
    [ColumnKinds.integer]: retrieveRawValue,
    [ColumnKinds.link]: retrieveLinkDisplayValue,
    [ColumnKinds.numeric]: retrieveRawValue,
    [ColumnKinds.richtext]: retrieveDisplayValue,
    [ColumnKinds.shorttext]: retrieveDisplayValue,
    [ColumnKinds.text]: retrieveDisplayValue
  };

  const buildValueFilter = (name, op, query) => {
    const kind = columnKindLookup[name];
    const modes = ModesForKind[kind];
    const pred = modes && modes[op];
    if (typeof pred !== "function") {
      throw new Error(
        `Filter operation <${op}${
          query === undefined ? "" : " " + query
        }> is unknown for column <${name}> of kind <${kind}>`
      );
    } else {
      return pred(query);
    }
  };

  return {
    getValue: name => lookupFn[columnKindLookup[name]](name),
    getValueFilter: buildValueFilter
  };
};

export const filterStateful = (ternaryFn, initialState) => coll => {
  const result = [];
  let state = initialState;
  const getState = () => state;
  const updateState = fn => void (state = fn(state));
  const setState = newState => void (state = newState);
  const ctx = { get: getState, set: setState, update: updateState };
  console.log("filterStateful", ternaryFn, initialState, coll);
  coll.forEach((el, idx) => {
    if (ternaryFn(el, idx, ctx)) result.push(el);
  });
  return [result, state];
};

export default {
  ModesForKind,
  buildContext,
  canFilterByColumnKind,
  parse
};
