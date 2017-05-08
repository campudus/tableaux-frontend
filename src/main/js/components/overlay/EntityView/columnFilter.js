import {ColumnKinds, FallbackLanguage} from "../../../constants/TableauxConstants";
import RowConcatHelper from "../../../helpers/RowConcatHelper";
import SearchFunctions from "../../../helpers/searchFunctions";
import * as f from "lodash/fp";

const isOfKind = kind => f.matchesProperty("kind", kind);

const joinLinkStrings = langtag => f.compose(
  f.join(":"),
  f.map(f.defaultTo("")),
  f.map(f.trim),
  f.map(f.prop([langtag])),
  f.prop("linkStringLanguages")
);

const joinAttachmentFileNames = langtag => f.compose(
  f.defaultTo(""),
  f.trim,
  f.map(v => f.prop(["title", langtag], v) || f.prop(["externalName", langtag], v) || f.prop(["externalName", FallbackLanguage], v)),
  f.prop("value")
);

const getConcatString = langtag => cell => {
  const str = cell.rowConcatString(langtag);
  return (str === RowConcatHelper.NOVALUE) ? "" : cleanString(str);
};

const cleanString = f.compose(f.trim, f.toLower, f.toString);

const getSortableCellValue = langtag => cell => {
  const columnName = cell.column.displayName[langtag] || cell.column.displayName[FallbackLanguage];

  const getCellValue = cell => {
    const rawValue = f.cond([
      [f.prop("isLink"), joinLinkStrings(langtag)],
      [isOfKind(ColumnKinds.attachment), joinAttachmentFileNames(langtag)],
      [isOfKind(ColumnKinds.concat), getConcatString(langtag)],
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
