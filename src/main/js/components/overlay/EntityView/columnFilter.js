import {ColumnKinds, FallbackLanguage} from "../../../constants/TableauxConstants";
import SearchFunctions from "../../../helpers/searchFunctions";
import * as f from "lodash/fp";

const isOfKind = kind => f.matchesProperty("kind", kind);

const joinLinkStrings = langtag => f.flow(
  f.get("displayValue"),
  f.map(f.get([langtag])),
  f.map(f.trim),
  f.map(f.defaultTo("")),
  f.join(":")
);

const joinAttachmentFileNames = langtag => f.flow(
  f.get("value"),
  f.map(v => f.prop(["title", langtag], v) || f.prop(["externalName", langtag], v) || f.prop(["externalName", FallbackLanguage], v)),
  f.trim,
  f.defaultTo("")
);

const cleanString = f.flow(f.toString, f.toLower, f.trim);

const getSortableCellValue = langtag => cell => {
  const columnName = cell.column.displayName[langtag] || cell.column.displayName[FallbackLanguage];

  const getCellValue = cell => {
    const rawValue = f.cond([
      [f.prop("isLink"), joinLinkStrings(langtag)],
      [isOfKind(ColumnKinds.attachment), joinAttachmentFileNames(langtag)],
      [isOfKind(ColumnKinds.concat), f.get(["displayValue", langtag])],
      [isOfKind(ColumnKinds.group), f.get(["displayValue", langtag])],
      [f.prop("isMultiLanguage"), f.prop(["value", langtag])],
      [f.stubTrue, f.prop(["value"])]
    ])(cell);
    const fixedValue = f.cond([
      [isOfKind(ColumnKinds.number), f.always(f.toNumber(rawValue))],
      [isOfKind(ColumnKinds.boolean), f.always(!!rawValue)],
      [f.stubTrue, f.always(cleanString(rawValue))]
    ])(cell);
    return (fixedValue || cell.kind === ColumnKinds.boolean) ? fixedValue : "";
  };

  return {
    columnName: columnName,
    value: getCellValue(cell)
  };
};

const rowFilter = (langtag, {mode, value}) => {
  const filterFn = SearchFunctions[mode](value);
  const getValue = getSortableCellValue(langtag);
  return cell => {
    const values = getValue(cell);
    return filterFn(values.columnName) || filterFn(values.value);
  };
};

export default rowFilter;
