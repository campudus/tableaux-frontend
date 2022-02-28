import f from "lodash/fp";

import {
  ColumnKinds,
  FilterModes,
  StatusFilterMode,
  SortValues,
  RowIdColumn
} from "../../constants/TableauxConstants";
import { doto, either, withTryCatch } from "../../helpers/functools";
import searchFunctions, { StatusSearchFunction } from "../../helpers/searchFunctions";

export const FilterableCellKinds = [
  ColumnKinds.concat,
  ColumnKinds.shorttext,
  ColumnKinds.richtext,
  ColumnKinds.text,
  ColumnKinds.numeric,
  ColumnKinds.link,
  ColumnKinds.boolean
];

export const SortableCellKinds = [
  ColumnKinds.text,
  ColumnKinds.shorttext,
  ColumnKinds.richtext,
  ColumnKinds.numeric,
  ColumnKinds.concat,
  ColumnKinds.link,
  ColumnKinds.boolean,
  ColumnKinds.date,
  ColumnKinds.datetime
];

const FlagSearches = [
  FilterModes.CHECK_ME,
  FilterModes.IMPORTANT,
  FilterModes.POSTPONE,
  FilterModes.WITH_COMMENT
];

const rememberColumnIds = colSet => f.tap(val => colSet.add(val.column.id));

const getFilteredRows = (
  currentTable,
  rowsWithIndex,
  columns,
  langtag,
  filterSettings
) => {
  const closures = mkClosures(columns, rowsWithIndex, langtag, filterSettings);
  const allFilters = f.flow(
    // eslint-disable-line lodash-fp/prefer-composition-grouping
    f.map(mkFilterFn(closures)),
    f.map(fn => withTryCatch(fn, console.error)) // to get errors, replace f.always(false) with eg. console.error
  )(filterSettings.filters || []);
  const combinedFilter = f.flow(
    f.juxt(allFilters),
    f.every(f.identity)
  );
  const filteredRows = f.filter(combinedFilter, rowsWithIndex);
  const { sortColumnId, sortValue } = filterSettings;

  // sort by ID
  if (sortColumnId === RowIdColumn.id) {
    const ordered = f.orderBy(["id"], [f.toLower(sortValue)], filteredRows);
    return {
      visibleRows: f.map("rowIndex", ordered),
      colsWithMatches: f.toArray(closures.colsWithMatches)
    };
  }

  const columnIndex = f.findIndex(
    column => column.id === sortColumnId,
    columns
  );
  const sortColumn = columns[columnIndex];
  const compareFuncs = {
    [ColumnKinds.numeric]: f.compose(
      f.toNumber,
      f.get(["values", columnIndex, "displayValue", langtag])
    ),
    [ColumnKinds.link]: f.compose(
      f.toLower,
      f.get(["values", columnIndex, "displayValue", 0, langtag])
    ),
    [ColumnKinds.text]: f.compose(
      f.deburr,
      f.toLower,
      f.get(["values", columnIndex, "displayValue", langtag])
    ),
    [ColumnKinds.date]: f.compose(
      value => new Date(value),
      f.get(["values", columnIndex, "value"])
    ),
    [ColumnKinds.boolean]: f.get(["values", columnIndex, "value"])
  };
  const getCompareFunc = f.cond([
    [
      kind =>
        f.includes(kind, [
          ColumnKinds.text,
          ColumnKinds.shorttext,
          ColumnKinds.concat,
          ColumnKinds.richtext
        ]),
      f.always(f.get(ColumnKinds.text, compareFuncs))
    ],
    [f.eq(ColumnKinds.link), f.always(f.get(ColumnKinds.link, compareFuncs))],
    [
      f.eq(ColumnKinds.numeric),
      f.always(f.get(ColumnKinds.numeric, compareFuncs))
    ],
    [
      kind => f.includes(kind, [ColumnKinds.datetime, ColumnKinds.date]),
      f.always(f.get(ColumnKinds.date, compareFuncs))
    ],
    [
      f.eq(ColumnKinds.boolean),
      f.always(f.get(ColumnKinds.boolean, compareFuncs))
    ]
  ]);

  const ordered = f.isFinite(sortColumnId)
    ? f.flow(
      f.orderBy([getCompareFunc(sortColumn.kind)], [f.toLower(sortValue)]),
      sorted => {
        if (f.toLower(sortValue) === "desc") {
          return sorted;
        }
        const firstTruthy = f.findIndex(
          getCompareFunc(sortColumn.kind),
          sorted
        );
        const falsyValues = f.slice(0, firstTruthy, sorted);
        const truthyValues = f.slice(firstTruthy, sorted.length, sorted);
        return [...truthyValues, ...falsyValues];
      }
    )(filteredRows)
    : filteredRows;
  return {
    visibleRows: f.map("rowIndex", ordered),
    colsWithMatches: f.toArray(closures.colsWithMatches)
  };
};

const mkFilterFn = closures => settings => {
  const valueFilters = [FilterModes.CONTAINS, FilterModes.STARTS_WITH];
  return f.cond([
    [f.matchesProperty("mode", FilterModes.ID_ONLY), mkIDFilter(closures)],
    [
      f.matchesProperty("mode", FilterModes.UNTRANSLATED),
      mkTranslationStatusFilter(closures)
    ],
    [
      f.matchesProperty("mode", FilterModes.ANY_UNTRANSLATED),
      mkOthersTranslationStatusFilter(closures)
    ],
    [f.matchesProperty("mode", FilterModes.FINAL), mkFinalFilter(closures)],
    [
      f.matchesProperty("mode", FilterModes.ROW_CONTAINS),
      mkAnywhereFilter(closures)
    ],
    [
      f.matchesProperty("mode", FilterModes.TRANSLATOR_FILTER),
      mkTranslatorFilter(closures)
    ],
    [
      ({ mode }) => f.contains(mode, FlagSearches),
      ({ mode, value }) => mkFlagFilter(closures, mode, value)
    ],
    [
      f.matchesProperty("columnKind", ColumnKinds.boolean),
      mkBoolFilter(closures)
    ],
    [
      ({ mode }) => f.contains(mode, valueFilters),
      mkColumnValueFilter(closures)
    ],
    [({ mode }) => mode === StatusFilterMode, mkColumnValueFilter(closures)],
    [f.stubTrue, () => f.stubTrue]
  ])(settings);
};

const mkAnywhereFilter = closures => ({ value }) => {
  return f.flow(
    f.get("values"),
    f.filter(
      f.overEvery([
        cell => f.contains(cell.kind, FilterableCellKinds),
        cell =>
          searchFunctions[FilterModes.CONTAINS](
            value,
            closures.getSortableCellValue(cell)
          )
      ])
    ),
    f.map(rememberColumnIds(closures.colsWithMatches)),
    f.any(f.identity)
  );
};

const mkBoolFilter = closures => ({ value, columnId }) => row => {
  const idx = closures.getColumnIndex(columnId);
  const { values } = row;
  return doto(
    values[idx],
    cell => (cell.isMultiLanguage ? cell.value[closures.langtag] : cell.value),
    boolVal => !!boolVal === value
  );
};

const mkTranslatorFilter = closures => () => row => {
  if (f.isEmpty(closures.colsWithMatches)) {
    row.columns
      .filter(f.get("isMultilanguage"))
      .forEach(rememberColumnIds(closures.colsWithMatches));
  }
  return f.flow(
    f.map(["annotations", "translationNeeded", "langtags", closures.langtag]),
    f.any(f.identity)
  )(row);
};

const mkFinalFilter = () => ({ value }) => {
  return cellValue => f.eq(!!cellValue.final, value);
};

const mkIDFilter = () => ({ value }) => {
  return f.flow(
    f.get("id"),
    id => f.contains(id, value)
  );
};

const hasUntranslatedCells = (closures, needsTranslation) =>
  f.flow(
    f.get(["values"]),
    f.filter(needsTranslation),
    f.complement(f.isEmpty)
  );

const mkOthersTranslationStatusFilter = closures => ({ value }) => {
  const needsTranslation = f.flow(
    f.get(["annotations", "translationNeeded", "langtags"]),
    f.complement(f.isEmpty),
    match => (value ? match : !match)
  );

  const hasUntranslatedCellsFn = hasUntranslatedCells(
    closures,
    needsTranslation
  );
  return value === true
    ? hasUntranslatedCellsFn
    : f.complement(hasUntranslatedCellsFn);
};

const mkTranslationStatusFilter = closures => ({ value }) => {
  const needsTranslation = f.flow(
    f.get(["annotations", "translationNeeded", "langtags"]),
    f.contains(closures.langtag),
    match => (value ? match : !match)
  );

  const hasUntranslatedCellsFn = hasUntranslatedCells(
    closures,
    needsTranslation
  );
  return value === true
    ? hasUntranslatedCellsFn
    : f.complement(hasUntranslatedCellsFn);
};

const mkFlagFilter = (closures, mode, value) => {
  const flag = f.get(mode, {
    [FilterModes.IMPORTANT]: "important",
    [FilterModes.POSTPONE]: "postpone",
    [FilterModes.CHECK_ME]: "check-me"
  });

  const findAnnotation = flag
    ? f.get(["annotations", flag]) // search for flag
    : f.flow(
      f.get("annotations"),
      f.keys,
      f.intersection(["info", "warning", "error"]),
      f.complement(f.isEmpty)
    );

  return f.flow(
    f.get(["values"]),
    f.filter(findAnnotation),
    f.forEach(rememberColumnIds(closures.colsWithMatches)),
    f.isEmpty,
    misMatch => (value ? !misMatch : misMatch)
  );
};

const mkColumnValueFilter = closures => ({
  value,
  mode,
  columnId,
  colId,
  compareValue
}) => {
  const id = f.isNumber(columnId) && !isNaN(columnId) ? columnId : colId;
  const filterColumnIndex = closures.getColumnIndex(id);
  const toFilterValue = closures.cleanString(
    mode === StatusFilterMode ? compareValue : value
  );
  const getSortableCellValue = closures.getSortableCellValue;

  if (f.isEmpty(toFilterValue) && typeof sortColumnId === "undefined") {
    return f.stubTrue;
  }

  return row => {
    const firstCell = f.get(["values", 0], row);
    const firstCellValue = getSortableCellValue(firstCell);

    // Always return true for rows with empty first value.
    // This should allow to add new rows while filtered.
    // f.isEmpty(123) returns TRUE, so we check for number (int & float)
    if (f.isEmpty(firstCellValue) && !f.isNumber(firstCellValue)) {
      return true;
    }

    const targetCell = f.get(["values", filterColumnIndex], row);
    const searchFunction = searchFunctions[mode];

    if (f.contains(targetCell.kind, FilterableCellKinds)) {
      return searchFunction(toFilterValue, getSortableCellValue(targetCell));
    } else if (mode === StatusFilterMode) {
      return StatusSearchFunction(
        toFilterValue,
        value,
        getSortableCellValue(targetCell)
      );
    } else {
      // column type not support for filtering
      return false;
    }
  };
};

// Generate settings-specific helper functions needed by all filters
const mkClosures = (columns, rows, langtag, rowsFilter) => {
  const cleanString = f.flow(
    f.toString,
    f.toLower,
    f.trim
  );
  const getColumnIndex = id =>
    f.findIndex(f.matchesProperty("id", id), columns);
  const { sortValue } = rowsFilter;

  const sortColumnIdx = getColumnIndex(rowsFilter.sortColumnId);
  const isOfKind = kind => f.matchesProperty("kind", kind);
  const joinStrings = f.flow(
    f.get("displayValue"),
    f.map(f.get(langtag)),
    f.join("::")
  );

  const getPlainValue = cell =>
    cell.isMultiLanguage ? cell.value[langtag] : cell.value;
  const getStatusValue = cell => {
    const {
      column: { rules },
      value
    } = cell;
    return f.compose(
      f.join("::"),
      f.map(f.get(["displayValue", langtag])),
      f.filter("value"),
      f.zipWith(
        (singleValue, rule) => ({
          value: singleValue,
          displayValue: rule.displayName
        }),
        value
      )
    )(rules);
  };

  const getSortableCellValue = cell => {
    const rawValue = f.cond([
      [isOfKind(ColumnKinds.boolean), getPlainValue],
      [isOfKind(ColumnKinds.link), joinStrings],
      [isOfKind(ColumnKinds.attachment), joinStrings],
      [isOfKind(ColumnKinds.date), getPlainValue],
      [isOfKind(ColumnKinds.datetime), getPlainValue],
      [isOfKind(ColumnKinds.status), getStatusValue],
      [f.stubTrue, f.get(["displayValue", langtag])]
    ])(cell);
    const sortFirst = "a";
    const sortLast = "b";
    return f.cond([
      [isOfKind(ColumnKinds.numeric), f.always(f.toNumber(rawValue))],
      [
        isOfKind(ColumnKinds.boolean),
        f.always(rawValue ? sortFirst : sortLast)
      ],
      [f.stubTrue, f.always(f.toLower(rawValue) || "")]
    ])(cell);
  };

  const comparator = (a, b) => {
    const dir = sortValue === SortValues.ASC ? +1 : -1;
    const [gt, lt] = [dir, -dir];
    const [aFirst, bFirst, equal] = [-1, +1, 0];
    const getSortValue = row => {
      return either(row)
        .map(r => r.cells.at(sortColumnIdx))
        .map(getSortableCellValue)
        .getOrElse(null);
    };
    const compareRowIds = (a, b) => {
      const idOf = f.prop("id");
      return idOf(a) === idOf(b) ? equal : idOf(a) - idOf(b);
    };
    const compareValues = (a, b) => (a > b ? gt : lt);
    const isEmpty = x => !x && x !== 0 && x !== !!x;

    return sortColumnIdx >= 0
      ? f.cond([
        [vals => f.every(isEmpty, vals), f.always(equal)],
        [([A, dummy]) => isEmpty(A), f.always(bFirst)], // eslint-disable-line no-unused-vars
        [([dummy, B]) => isEmpty(B), f.always(aFirst)], // eslint-disable-line no-unused-vars
        [
          f.stubTrue,
          ([A, B]) => (f.eq(A, B) ? compareRowIds(a, b) : compareValues(A, B))
        ]
      ])([a, b].map(getSortValue))
      : compareRowIds(a, b);
  };

  return {
    getColumnIndex: getColumnIndex,
    getSortableCellValue: getSortableCellValue,
    rows: rows,
    colsWithMatches: new Set(),
    cleanString: cleanString,
    comparator: comparator,
    langtag
  };
};
const completeRowInformation = (columns, table, rows, allDisplayValues) => {
  const tableDisplayValues = allDisplayValues[table.id];
  // generate and reuse one getter per table
  const getLinkDisplayValue = f.memoize(tableId =>
    // memoize every link during this filter
    f.memoize(linkId => {
      const dv = doto(
        allDisplayValues,
        f.prop([tableId]),
        f.find(f.propEq("id", linkId)),
        f.prop(["values", 0])
      );
      return dv;
    })
  );

  return rows.map(({ id, cells, values, annotations, final }, rowIndex) => ({
    rowIndex,
    id,
    annotations,
    final,
    values: cells.map((cell, colIndex) => ({
      ...cell,
      displayValue:
        cell.kind === ColumnKinds.link
          ? values[colIndex].map(link =>
            getLinkDisplayValue(columns[colIndex].toTable)(link.id)
          )
          : tableDisplayValues[rowIndex].values[colIndex],
      value: values[colIndex]
    }))
  }));
};

export default getFilteredRows;
export { completeRowInformation };
