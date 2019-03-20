import React from "react";
import * as f from "lodash/fp";
import i18n from "i18next";

import { ColumnKinds, DefaultLangtag } from "../../constants/TableauxConstants";
import {
  addTranslationNeeded,
  deleteCellAnnotation,
  isLocked
} from "../../helpers/annotationHelper";
import { canConvert, convert } from "../../helpers/cellValueConverter";
import {
  getUserLanguageAccess,
  hasUserAccessToLanguage,
  isUserAdmin
} from "../../helpers/accessManagementHelper";
import { makeRequest } from "../../helpers/apiHelper";
import { mapPromise, propMatches } from "../../helpers/functools";
import Footer from "../overlay/Footer";
import Header from "../overlay/Header";
import PasteMultilanguageCellInfo from "../overlay/PasteMultilanguageCellInfo";
import actions from "../../redux/actionCreators";
import askForSessionUnlock from "../helperComponents/SessionUnlockDialog";
import route from "../../helpers/apiRoutes";
import store from "../../redux/store";

const showErrorToast = (msg, data = {}) => {
  store.dispatch(
    actions.showToast({
      content: <div id="cell-jump-toast">{i18n.t(msg, data)}</div>,
      duration: 3000
    })
  );
};

const changeCellValue = (cell, newValue) => {
  store.dispatch(
    actions.changeCellValue({
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
    (value, idx) => !canNotCopy(columns[idx])
  );
  return {
    columns: f.reject(canNotCopy, columns),
    rows: [{ values: duplicatedValues }],
    constrainedLinkIds
  };
};

const calcNewValue = function(src, srcLang, dst, dstLang) {
  const untranslated = f.prop(["annotations", "translationNeeded", "langtags"]);
  const getAllowedValue = langtag =>
    hasUserAccessToLanguage(langtag) ||
    isUserAdmin() ||
    f.contains(langtag, untranslated)
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

// When links have a backlink/left constraint, we duplicate the linked
// entries in their respective tables and link the duplicates in the
// pasted cell to avoid violating constraints
const createEntriesAndCopy = async (src, dst, constrainedValue) => {
  const toTable = src.tables.get(src.column.toTable);
  const columns = await makeRequest({
    apiRoute: route.toTable({ tableId: toTable.id })
  });

  const linkIds = f.map("id", constrainedValue);
  const fetchLinkData = rowId =>
    makeRequest({ apiRoute: route.toRow({ tableId: toTable.id, rowId }) }).then(
      f.prop("values")
    );

  const copiedLinkValues = await mapPromise(fetchLinkData, linkIds)
    .then(f.map(row => getSaveableRowDuplicate({ columns, row })))
    // Reduce all saveable rows into an array so we need only one POST to duplicate them
    .then(
      f.reduce((accum, nextRow) => ({
        columns: nextRow.columns,
        rows: [...f.propOr([], "rows", accum), f.prop("row.0", nextRow)]
      }))
    )
    .then(rowsToCopy =>
      makeRequest({
        apiRoute: route.toRows({
          tableId: toTable.id,
          data: rowsToCopy,
          method: "POST"
        })
      })
    )
    .then(f.prop("rows"))
    .then(f.map(row => ({ id: row.id, value: f.first(row.values) })));

  changeCellValue(dst, copiedLinkValues);
};

async function pasteValueAndTranslationStatus(src, dst, reducedValue) {
  changeCellValue(dst, reducedValue);
  if (src.column.multilanguage && dst.column.multilanguage) {
    const srcTranslation = f.get(["annotations", "translationNeeded"], src);
    const dstTranslation = f.get(["annotations", "translationNeeded"], dst);
    const srcLangtags = f.get("langtags", srcTranslation);

    // Remove existing translation status and replace it with src's
    deleteCellAnnotation(dstTranslation, dst).then(() => {
      if (!f.isEmpty(srcLangtags)) {
        addTranslationNeeded(srcLangtags, dst);
      }
    });
  }
}

const pasteCellValue = function(
  src,
  srcLang,
  dst,
  dstLang,
  skipDialogs = false
) {
  const canOverrideLock = () => {
    const untranslated = f.prop([
      "annotations",
      "translationNeeded",
      "langtags"
    ]);
    const canTranslate = f.intersection(untranslated, getUserLanguageAccess());
    return dst.column.multilanguage
      ? (src.column.multilanguage && !f.isEmpty(canTranslate)) ||
          (!src.column.multilanguage && f.contains(dstLang, canTranslate))
      : f.contains(dstLang, canTranslate);
  };

  if (isLocked(dst.row) && !canOverrideLock()) {
    const toastContent = askForSessionUnlock(dst.row);
    if (toastContent) {
      store.dispatch(actions.showToast(toastContent));
    }
    return;
  }

  if (!dst.column.multilanguage && !hasUserAccessToLanguage(dstLang)) {
    showErrorToast("table:translation.cant_access_language");
    return;
  }

  if (dst.kind === ColumnKinds.link && src.kind === ColumnKinds.link) {
    if (canCopyLinks(src, dst)) {
      copyLinks(src, dst);
    } else {
      const srcTable = this.tables.get(src.column.toTable);
      const srcTableName = f.find(
        f.identity,
        f.props([dstLang, DefaultLangtag], srcTable.displayName)
      );
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
    if (!newValue) {
      showErrorToast("table:copy_kind_error");
      return;
    }
    pasteValueAndTranslationStatus(src, dst, newValue);
  } else {
    const newValue = calcNewValue.call(this, src, srcLang, dst, dstLang);
    if (!newValue) {
      showErrorToast("table:copy_kind_error");
      return;
    }
    const save = event => {
      if (event) {
        event.preventDefault();
      }
      pasteValueAndTranslationStatus(src, dst, newValue);
    };
    const buttons = {
      positive: [i18n.t("common:save"), save],
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

export default pasteCellValue;
