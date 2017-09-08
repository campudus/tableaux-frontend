import * as f from "lodash/fp";
import ActionCreator from "../../actions/ActionCreator";
import {ColumnKinds, DefaultLangtag} from "../../constants/TableauxConstants";
import {convert, canConvert} from "../../helpers/cellValueConverter";
import React from "react";
import i18n from "i18next";
import PasteMultilanguageCellInfo from "../overlay/PasteMultilanguageCellInfo";
import {hasUserAccessToLanguage, isUserAdmin, getUserLanguageAccess} from "../../helpers/accessManagementHelper";
import {isLocked} from "../../helpers/annotationHelper";
import askForSessionUnlock from "../helperComponents/SessionUnlockDialog";
import Header from "../overlay/Header";
import Footer from "../overlay/Footer";
import {Promise} from "es6-promise";
const throat = require("throat")(Promise); // throat ignores the global Promise polyfill, so pass it

const MAX_CONCURRENT_REQUESTS = 3; // retrieve row or copy cell

const showErrorToast = (msg, data = {}) => {
  ActionCreator.showToast(<div id="cell-jump-toast">{i18n.t(msg, data)}</div>, 3000);
};

const canCopySafely = (src, dst) => !src.isMultiLanguage || (src.isMultiLanguage && !dst.isMultiLanguage)
  || (dst.isMultiLanguage && f.every(v => f.isEmpty(v) && !f.isNumber(v), f.values(f.prop("value", dst))));
const canCopyLinks = (src, dst) => dst.column.toTable === src.column.toTable;

const calcNewValue = function (src, srcLang, dst, dstLang) {
  const untranslated = f.prop(["annotations", "translationNeeded", "langtags"]);
  const getAllowedValue = langtag => (hasUserAccessToLanguage(langtag) || isUserAdmin() || f.contains(langtag, untranslated))
    ? f.prop(["value", langtag], src)
    : f.prop(["value", langtag], dst);
  if (!src.isMultiLanguage && !dst.isMultiLanguage) {
    return convert(src.kind, dst.kind, src.value);
  } else if (src.isMultiLanguage && dst.isMultiLanguage) {
    const combinedLangtags = f.uniq([...f.keys(src.value), ...f.keys(dst.value)]);
    return f.reduce(
      (result, langtag) => f.assoc(langtag, convert(src.kind, dst.kind, getAllowedValue(langtag) || ""), result),
      {}, combinedLangtags);
  } else if (dst.isMultiLanguage) { // set only current langtag's value of dst to src value
    return f.assoc(dstLang, convert(src.kind, dst.kind, src.value), dst.value);
  } else { // src.isMultiLanguage
    return convert(src.kind, dst.kind, src.value[srcLang]);
  }
};

const copyGroupColumn = (src, srcLang, dst, dstLang) => {
  if (src.column.id !== dst.column.id || src.tableId !== dst.tableId) {
    showErrorToast("table:copy_kind_error");
    return;
  }
  const groupIds = src.column.groups.map("id");
  const getCell = (row) => (colId) => row.cells.get(`cell-${row.tableId}-${colId}-${row.id}`);
  const cellTuples = f.zip(
    groupIds.map(getCell(src.row)),
    groupIds.map(getCell(dst.row))
  );
  cellTuples.forEach(
    ([srcCell, dstCell]) => pasteCellValue(srcCell, srcLang, dstCell, dstLang, true)
  );
};

// (cell, cell) -> nil
const copyLinks = (src, dst) => {
  const cardinality = f.get(["column", "constraint", "cardinality"], dst);
  if (f.isEmpty(cardinality)) {
    ActionCreator.changeCell(dst, src.value);
  } else {
    // Cardinality constraints do exist
    const cardinalityFrom = (f.gt(cardinality.from, 0)) ? cardinality.from : 0; // set zero or undefined to 0
    const cardinalityTo = (f.gt(cardinality.to, 0)) ? cardinality.to : Number.POSITIVE_INFINITY;
    const constrainedValue = f.take(cardinalityTo, src.value); // take the first allowed number of links to copy
    if (cardinalityFrom === 0) {
      // No constrained to the left => just set values
      ActionCreator.changeCell(dst, constrainedValue);
    } else {
      // Link constrained to left, too => create new rows in toTable, link and fill them
      createEntriesAndCopy(src, dst, constrainedValue);
    }
  }
};

const createEntriesAndCopy = (src, dst, constrainedValue) => {
  const toTable = src.tables.get(src.column.toTable);

  const initTable = new Promise(
    (resolve, reject) => {
      toTable.columns.fetch({
        success: resolve,
        error: reject
      });
    }
  ).catch(e => {
    // Populate log then rethrow for sentry
    console.error("cellCopy: duplicateRow", e);
    throw (e);
  });

  // id -> toTable.rows.get(id)
  const requestRow = (rowId) => new Promise(
    (resolve, reject) => {
      toTable.rows.fetchById(
        rowId,
        (err, row) => {
          if (err) {
            console.error("cellCopy: request Row", err);
            reject(err);
          } else {
            resolve(row);
          }
        }
      );
    }
  );

  const duplicateRow = (row) => row.safelyDuplicate();

  const toLinkValue = (row) => new Promise(
    (resolve) => {
      resolve(
        {
          id: row.id,
          value: row.cells.at(0).value
        }
      );
    }
  );

  // rowId -> LinkValue {id, value}
  const copyOneLink = ({id}) => (
    requestRow(id)
      .then(duplicateRow)
      .then(toLinkValue)
  );

  initTable.then(
    () => Promise.all(
      constrainedValue.map(
        throat(MAX_CONCURRENT_REQUESTS, copyOneLink)
      )
    )
      .then((linkValues) => {
        ActionCreator.changeCell(dst, linkValues);
      })
  );
};

const pasteCellValue = function (src, srcLang, dst, dstLang, skipDialogs = false) {
  const canOverrideLock = () => {
    const untranslated = f.prop(["annotations", "translationNeeded", "langtags"]);
    const canTranslate = f.intersection(untranslated, getUserLanguageAccess());
    return (dst.isMultiLanguage)
      ? (src.isMultiLanguage && !f.isEmpty(canTranslate)) || (!src.isMultiLanguage && f.contains(dstLang, canTranslate))
      : f.contains(dstLang, canTranslate);
  };
  if (isLocked(dst.row) && !canOverrideLock()) {
    askForSessionUnlock(dst.row, {key: "v"});
    return;
  }

  if (!dst.isMultiLanguage && !hasUserAccessToLanguage(dstLang)) {
    showErrorToast("table:translation.cant_access_language");
    return;
  }

  if (dst.kind === ColumnKinds.link && src.kind === ColumnKinds.link) {
    if (canCopyLinks(src, dst)) {
      copyLinks(src, dst);
    } else {
      const srcTable = this.tables.get(src.column.toTable);
      const srcTableName = f.find(f.identity, f.props([this.props.langtag, DefaultLangtag], srcTable.displayName));
      showErrorToast("table:copy_links_error", {table: srcTableName});
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
    ActionCreator.changeCell(dst, newValue);
  } else {
    const newValue = calcNewValue.call(this, src, srcLang, dst, dstLang);
    if (!newValue) {
      showErrorToast("table:copy_kind_error");
      return;
    }
    const save = (event) => {
      if (event) {
        event.preventDefault();
      }
      ActionCreator.changeCell(dst, newValue);
    };
    const buttons = {
      positive: [i18n.t("common:save"), save],
      neutral: [i18n.t("common:cancel"), null]
    };
    ActionCreator.openOverlay({
      head: <Header title={i18n.t("table:copy_cell")} />,
      body: <PasteMultilanguageCellInfo langtag={this.props.langtag}
        oldVals={dst.value}
        newVals={newValue}
        saveAndClose={save}
        kind={dst.kind}
      />,
      footer: <Footer actions={buttons} />,
      keyboardShortcuts: {enter: event => { save(event); ActionCreator.closeOverlay(); }}
    });
  }
};

export default pasteCellValue;
