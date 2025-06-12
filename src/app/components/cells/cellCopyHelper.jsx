import i18n from "i18next";
import * as f from "lodash/fp";
import React from "react";
import { ColumnKinds } from "../../constants/TableauxConstants";
import { canUserChangeCell } from "../../helpers/accessManagementHelper";
import {
  addTranslationNeeded,
  deleteCellAnnotation
} from "../../helpers/annotationHelper";
import { makeRequest } from "../../helpers/apiHelper";
import route from "../../helpers/apiRoutes";
import { canConvert, convert } from "../../helpers/cellValueConverter";
import { mapPromise, propMatches } from "../../helpers/functools";
import getDisplayValue from "../../helpers/getDisplayValue";
import { isTextInRange } from "../../helpers/limitTextLength";
import { getTableDisplayName } from "../../helpers/multiLanguage";
import P from "../../helpers/promise";
import actions from "../../redux/actionCreators";
import { createNewRows } from "../../redux/actions/rowActions";
import { idsToIndices } from "../../redux/redux-helpers";
import store from "../../redux/store";
import Footer from "../overlay/Footer";
import Header from "../overlay/Header";
import PasteMultilanguageCellInfo from "../overlay/PasteMultilanguageCellInfo";
import { isLocked, requestRowUnlock } from "../../helpers/rowUnlock";

const showErrorToast = (msg, data = {}) => {
  store.dispatch(
    actions.showToast({
      content: <div id="cell-jump-toast">{i18n.t(msg, data)}</div>,
      duration: 3000
    })
  );
};

const changeCellValue = (cell, newValue, skipTranslationDialog) => {
  store.dispatch(
    actions.changeCellValue({
      skipTranslationDialog,
      cell,
      newValue,
      oldValue: cell.value
    })
  );
};

const canCopySafely = (src, dst) =>
  !src.column.multilanguage ||
  (src.column.multilanguage && !dst.column.multilanguage) ||
  (dst.column.multilanguage &&
    f.every(
      v => f.isEmpty(v) && !f.isNumber(v),
      f.values(f.prop("value", dst))
    ));
const canCopyLinks = (src, dst) => dst.column.toTable === src.column.toTable;

export const getSaveableRowDuplicate = ({ columns, row }) => {
  const isPositiveNumber = num => f.isInteger(num) && num > 0;

  const constrainedLinkIds = columns
    .filter(
      column =>
        column.kind === ColumnKinds.link &&
        propMatches(isPositiveNumber, "constraint.cardinality.from", column)
    )
    .map(f.prop("id"));

  const canNotCopy = column =>
    f.contains(column.id, constrainedLinkIds) ||
    column.kind === ColumnKinds.group ||
    column.kind === ColumnKinds.concat;

  // We can't check cardinality without loading and parsing all linked tables recursively,
  // so we don't copy links with cardinality
  const duplicatedValues = row.values.filter(
    (_, idx) => !canNotCopy(columns[idx])
  );
  return {
    columns: f.reject(canNotCopy, columns),
    rows: [{ values: duplicatedValues }],
    constrainedLinkIds
  };
};

const calcNewValue = function(src, srcLang, dst, dstLang) {
  const getAllowedValue = langtag =>
    canUserChangeCell(dst, langtag)
      ? f.prop(["value", langtag], src)
      : f.prop(["value", langtag], dst);
  if (!src.column.multilanguage && !dst.column.multilanguage) {
    return convert(src.kind, dst.kind, src.value);
  } else if (src.column.multilanguage && dst.column.multilanguage) {
    const combinedLangtags = f.uniq([
      ...f.keys(src.value),
      ...f.keys(dst.value)
    ]);
    return f.reduce(
      (result, langtag) =>
        f.assoc(
          langtag,
          convert(src.kind, dst.kind, getAllowedValue(langtag) || ""),
          result
        ),
      {},
      combinedLangtags
    );
  } else if (dst.column.multilanguage) {
    // !src.column.multilanguage && dest.column.multilanguage
    // set only current langtag's value of dst to src value
    return f.assoc(dstLang, convert(src.kind, dst.kind, src.value), dst.value);
  } else {
    // src.column.multilanguage && !dst.column.multilanguage
    // set value of dst do current langtag's value of src
    return convert(src.kind, dst.kind, src.value[srcLang]);
  }
};

const copyGroupColumn = (src, srcLang, dst, dstLang) => {
  if (src.column.id !== dst.column.id || src.tableId !== dst.tableId) {
    showErrorToast("table:copy_kind_error");
    return;
  }
  const columns = store.getState().columns[src.table.id].data;
  const groupColumnIds = src.column.groups.map(f.get("id"));
  const groupColumnIndices = columns.reduce(
    (accum, column, idx) =>
      f.contains(column.id, groupColumnIds) ? [...accum, idx] : accum,
    []
  );
  const getCell = row => idx => ({
    ...f.nth(idx, row.cells),
    value: f.nth(idx, row.values)
  });
  const cellTuples = f.zip(
    groupColumnIndices.map(getCell(src.row)),
    groupColumnIndices.map(getCell(dst.row))
  );
  cellTuples.forEach(([srcCell, dstCell]) =>
    pasteCellValue(srcCell, srcLang, dstCell, dstLang, true)
  );
};

// (cell, cell) -> nil
const copyLinks = (src, dst) => {
  const cardinality = f.get(["column", "constraint", "cardinality"], dst);
  if (f.isEmpty(cardinality)) {
    changeCellValue(dst, src.value);
  } else {
    // Cardinality constraints do exist
    const cardinalityFrom = f.gt(cardinality.from, 0) ? cardinality.from : 0; // set zero or undefined to 0
    const cardinalityTo = f.gt(cardinality.to, 0)
      ? cardinality.to
      : Number.POSITIVE_INFINITY;
    const constrainedValue = f.take(cardinalityTo, src.value); // take the first allowed number of links to copy
    if (cardinalityFrom === 0) {
      // No constrained to the left => just set values
      changeCellValue(dst, constrainedValue);
    } else {
      // Link constrained to left, too => create new rows in toTable, link and fill them
      createEntriesAndCopy(src, dst, constrainedValue);
    }
  }
};

// optionally curried function
export function createRowDuplicatesRequest(tableId, rowId) {
  return arguments.length === 1
    ? rowId_ => createRowDuplicatesRequest(tableId, rowId_)
    : makeRequest({
        apiRoute:
          route.toRow({ tableId, rowId }) +
          "/duplicate?skipConstrainedLinks=true&annotateSkipped=true",
        method: "POST"
      });
}

const maybeChangeBacklink = ({ src, dst }) => saveableRowDuplicate => {
  const { columns, rows } = saveableRowDuplicate;
  const { backlinkIndices } = f.reduce(
    (acc, column) => {
      const { idx, backlinkIndices } = acc;
      const newVal =
        column.kind === ColumnKinds.link && column.toTable === src.table.id
          ? f.concat(backlinkIndices, idx)
          : backlinkIndices;
      return { idx: idx + 1, backlinkIndices: newVal };
    },
    { idx: 0, backlinkIndices: [] },
    columns
  );
  if (f.isEmpty(backlinkIndices)) {
    return saveableRowDuplicate;
  }
  const newRow = f.reduce(
    (acc, val) => {
      return f.assoc([val, 0, "id"], dst.row.id, acc);
    },
    rows[0].values,
    backlinkIndices
  );
  return { ...saveableRowDuplicate, rows: [{ values: newRow }] };
};

// When links have a backlink/left constraint, we duplicate the linked
// entries in their respective tables and link the duplicates in the
// pasted cell to avoid violating constraints
const createEntriesAndCopy = async (src, dst, constrainedValue) => {
  const { tables } = store.getState();

  const toTable = f.get(["data", src.column.toTable, "id"], tables);
  const { columns } = await makeRequest({
    apiRoute: route.toAllColumns(toTable)
  });

  const linkIds = f.map("id", constrainedValue);
  const fetchLinkData = rowId =>
    makeRequest({ apiRoute: route.toRow({ tableId: toTable, rowId }) });

  const copiedLinkValues = await mapPromise(fetchLinkData, linkIds)
    .then(
      f.map(row =>
        f.compose(
          maybeChangeBacklink({ src, dst }),
          getSaveableRowDuplicate
        )({ columns, row })
      )
    )
    // Create all new links including backlinks in a single request (instead of 2N via duplicate, then changeBacklink)
    .then(
      f.reduce(
        (accum, nextRow) => ({
          columns: nextRow.columns,
          rows: [...f.propOr([], "rows", accum), f.prop(["rows", 0], nextRow)]
        }),
        []
      )
    )
    .then(cfg => createNewRows({ ...cfg, tableId: toTable.id }))
    .then(f.map(row => ({ id: row.id, value: f.first(row.values) })));

  changeCellValue(dst, copiedLinkValues);
  const displayValues = f.map(
    ({ id, value }) => ({
      id,
      values: [getDisplayValue(src.column.toColumn, value)]
    }),
    copiedLinkValues
  );
  store.dispatch(
    actions.addDisplayValues({
      displayValues: [
        {
          tableId: toTable,
          values: displayValues
        }
      ]
    })
  );
};

async function pasteValueAndTranslationStatus(
  src,
  dst,
  reducedValue,
  skipDialogs
) {
  changeCellValue(dst, reducedValue, skipDialogs);
  if (src.column.multilanguage && dst.column.multilanguage) {
    const srcTranslation = f.get(["annotations", "translationNeeded"], src);
    const dstTranslation = f.get(["annotations", "translationNeeded"], dst);
    const srcLangtags = f.get("langtags", srcTranslation);

    // Remove existing translation status and replace it with src's
    if (!f.isEmpty(dstTranslation)) {
      deleteCellAnnotation(dstTranslation, dst).then(() => {
        if (!f.isEmpty(srcLangtags)) {
          addTranslationNeeded(srcLangtags, dst);
        }
      });
    } else {
      if (!f.isEmpty(srcLangtags)) {
        addTranslationNeeded(srcLangtags, dst);
      }
    }
  }
}

const decelerate = fn => {
  const delay = 250; // ms
  return (...args) =>
    new Promise(resolve => {
      fn(...args);
      setTimeout(resolve, delay);
    });
};

const forceCellFocus = (target, store) => {
  const toggleFocus = () => store.dispatch(actions.toggleCellSelection(target));
  const needsRefocus = f.compose(
    f.whereEq(f.pick(["columnId", "rowId", "langtag"], target)),
    f.prop("selectedCell.selectedCell")
  )(store.getState());
  toggleFocus();
  if (needsRefocus) requestAnimationFrame(toggleFocus);
};

const startPasteOperation = (...args) => {
  const parallelPastes = 20;
  const reduxStore = store.getState();

  const [src, srcLang, dst, dstLang] = args;
  const multiSelection = f.prop("multiSelect", reduxStore);
  const isSinglePaste = f.isEmpty(multiSelection);
  const getIndices = cell =>
    idsToIndices(
      { tableId: dst.table.id, rowId: cell.row.id, columnId: cell.column.id },
      reduxStore
    );
  const getCurrentValue = cell => {
    // Selected cells don't store their value, as it would always be outdated
    const [rowIdx, colIdx] = getIndices(cell);

    return f.prop(
      `rows.${dst.table.id}.data.${rowIdx}.values.${colIdx}`,
      reduxStore
    );
  };

  if (!isSinglePaste) {
    const {
      table: { id: tableId },
      column: { id: columnId },
      row: { id: rowId }
    } = f.first(multiSelection);
    const cellToFocus = {
      tableId,
      columnId,
      rowId,
      langtag: srcLang
    };
    store.dispatch(actions.clearMultiselect());
    forceCellFocus(cellToFocus, store);
  }
  return isSinglePaste
    ? pasteCellValue(...args)
    : P.chunk(
        parallelPastes,
        decelerate(cell => {
          try {
            pasteCellValue(
              src,
              srcLang,
              { ...cell, value: getCurrentValue(cell) },
              dstLang,
              true
            );
          } catch (err) {
            console.error("Could not paste", src, "to", cell, err);
          }
        }),
        multiSelection
      );
};

const pasteCellValue = function(
  src, // cell
  srcLang, // langtag
  dst, // cell
  dstLang, // langtag
  skipDialogs = false
) {
  // The lock can be overridden, if a user has access to the langtag and it is flagged as "needs translation"
  const canOverrideLock = () => {
    const untranslated = f.prop([
      "annotations",
      "translationNeeded",
      "langtags"
    ]);
    const translatableLangtags = f.filter(
      lt => canUserChangeCell(dst, lt),
      untranslated
    );
    return dst.column.multilanguage
      ? (src.column.multilanguage && !f.isEmpty(translatableLangtags)) ||
          (!src.column.multilanguage &&
            f.contains(dstLang, translatableLangtags))
      : false;
  };

  const columnKindsWithPossibleLengthConstraints = [
    ColumnKinds.text,
    ColumnKinds.shorttext,
    ColumnKinds.richtext
  ];
  // Check possible text limits of destination cell
  if (columnKindsWithPossibleLengthConstraints.includes(dst.kind)) {
    const srcValue = src.column.multilanguage ? src.value[srcLang] : src.value;
    if (!isTextInRange(dst.column, srcValue)) {
      showErrorToast("table:copy_kind_error");
      return;
    }
  }

  if (!canUserChangeCell(dst, dstLang)) {
    dst.column.multilanguage &&
      showErrorToast("common:access_management.cant_access_language");
    return;
  }

  if (isLocked(dst.row) && !canOverrideLock()) {
    requestRowUnlock(dst.row);

    if (isLocked(dst.row)) {
      store.dispatch(
        actions.showToast({
          content: (
            <div id="cell-jump-toast">
              <h1>{i18n.t("table:final.unlock_header")}</h1>
              <p>{i18n.t("table:final.unlock_toast")}</p>
            </div>
          )
        })
      );
    }
    return;
  }

  if (dst.kind === ColumnKinds.link && src.kind === ColumnKinds.link) {
    if (canCopyLinks(src, dst)) {
      copyLinks(src, dst);
    } else {
      const srcTableName = getTableDisplayName(src.table, i18n.language);
      showErrorToast("table:copy_links_error", { table: srcTableName });
    }
    return;
  }

  if (dst.kind === ColumnKinds.group && src.kind === ColumnKinds.group) {
    return copyGroupColumn(src, srcLang, dst, dstLang);
  }

  if (!canConvert(src.kind, dst.kind)) {
    showErrorToast("table:copy_kind_error");
    return;
  }

  if (canCopySafely(src, dst) || skipDialogs) {
    const newValue = calcNewValue.call(this, src, srcLang, dst, dstLang);
    if (f.isNil(newValue) && !f.isNil(src.value)) {
      showErrorToast("table:copy_kind_error");
      return;
    }
    pasteValueAndTranslationStatus(src, dst, newValue, skipDialogs);
  } else {
    const newValue = calcNewValue.call(this, src, srcLang, dst, dstLang);
    if (f.isNil(newValue) && !f.isNil(src.value)) {
      showErrorToast("table:copy_kind_error");
      return;
    }
    const save = event => {
      if (event) {
        event.preventDefault();
      }
      pasteValueAndTranslationStatus(src, dst, newValue, skipDialogs);
    };
    const buttons = {
      positive: [
        i18n.t("common:save"),
        () => {
          store.dispatch(actions.closeOverlay());
          save();
        }
      ],
      neutral: [i18n.t("common:cancel"), null]
    };
    store.dispatch(
      actions.openOverlay({
        head: <Header title={i18n.t("table:copy_cell")} />,
        body: (
          <PasteMultilanguageCellInfo
            langtag={dstLang}
            oldVals={dst.value}
            newVals={newValue}
            saveAndClose={save}
            kind={dst.kind}
            cell={src}
          />
        ),
        footer: <Footer buttonActions={buttons} />,
        keyboardShortcuts: {
          enter: event => {
            save(event);
            store.dispatch(actions.closeOverlay());
          }
        }
      })
    );
  }
};

export default startPasteOperation;
