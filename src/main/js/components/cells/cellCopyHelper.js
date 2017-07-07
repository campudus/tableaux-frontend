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

const pasteCellValue = function (src, srcLang, dst, dstLang) {
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
      ActionCreator.changeCell(dst, src.value);
    } else {
      const srcTable = this.tables.get(src.column.toTable);
      const srcTableName = f.find(f.identity, f.props([this.props.langtag, DefaultLangtag], srcTable.displayName));
      showErrorToast("table:copy_links_error", {table: srcTableName});
    }
    return;
  }

  if (!canConvert(src.kind, dst.kind)) {
    showErrorToast("table:copy_kind_error");
    return;
  }

  if (canCopySafely(src, dst)) {
    const newValue = calcNewValue.call(this, src, srcLang, dst, dstLang);
    if (!newValue) {
      showErrorToast("table:copy_kind_error");
      return;
    }
    ActionCreator.changeCell(dst, newValue);
  } else {
    const newValue = (dst.kind === "link")
        ? src.value
        : calcNewValue.call(this, src, srcLang, dst, dstLang);
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
