import * as f from "lodash/fp";
import ActionCreator from "../../actions/ActionCreator";
import {ColumnKinds} from "../../constants/TableauxConstants";
import {maybe} from "../../helpers/monads";
import {convert, canConvert} from "../../helpers/cellValueConverter";
import React from "react";
import i18n from "i18next";
import PasteMultilanguageCellInfo from "../overlay/PasteMultilanguageCellInfo";

const canCopySafely = (src, dst) => !src.isMultiLanguage || (src.isMultiLanguage && !dst.isMultiLanguage);

const calcNewValue = function (src, srcLang, dst, dstLang) {
  if (!src.isMultiLanguage && !dst.isMultiLanguage) {
    return src.value;
  } else if (src.isMultiLanguage && dst.isMultiLanguage) {
    const combinedLangtags = f.uniq([...f.keys(src.value), ...f.keys(dst.value)]);
    return f.reduce((result, langtag) => f.assoc(langtag, maybe(src.value[langtag]).getOrElse(null), result),
      {}, combinedLangtags);
  } else if (dst.isMultiLanguage) { // set only current langtag's value of dst to src value
    return f.assoc(dstLang, src.value, dst.value);
  } else { // src.isMultiLanguage
    return src.value[srcLang];
  }
};

const pasteCellValue = function (src, srcLang, dst, dstLang) {
  const canCopyLinks = dst => dst.column.id === src.column.id && dst.tableId === src.tableId;

  if (!canConvert(src.kind, dst.kind)) {
    ActionCreator.showToast(<div id="cell-jump-toast">{i18n.t("table:copy_kind_error")}</div>, 3000);
    return;
  }

  if (dst.kind === ColumnKinds.link && !canCopyLinks(dst)) {
    ActionCreator.showToast(<div id="cell-jump-toast">{i18n.t("table:copy_links_error")}</div>, 3000);
    return;
  }

  if (canCopySafely(src, dst)) {
    const newValue = convert(src.kind, dst.kind, calcNewValue.call(this, src, srcLang, dst, dstLang));
    if (!newValue) {
      ActionCreator.showToast(
        <div id="cell-jump-toast">{i18n.t("table:copy_no_conversion_result")}</div>, 3000
      );
      return;
    }
    ActionCreator.changeCell(dst, newValue);
  } else {
    const newValue = convert(src.kind, dst.kind,
      (dst.kind === "link")
        ? src.value
        : calcNewValue.call(this, src, srcLang, dst, dstLang));
    if (!newValue) {
      ActionCreator.showToast(
        <div id="cell-jump-toast">{i18n.t("table:copy_no_conversion_result")}</div>, 3000
      );
      return;
    }
    const saveAndClose = (event) => {
      if (event) {
        event.preventDefault();
      }
      ActionCreator.changeCell(dst, newValue);
      ActionCreator.closeOverlay();
    };
    ActionCreator.openOverlay({
      keyboardShortcuts: {enter: (event) => saveAndClose()},
      head: <div className="overlay-header">{i18n.t("table:confirm_copy.header")}</div>,
      body: <PasteMultilanguageCellInfo langtag={this.props.langtag}
                                        oldVals={dst.value}
                                        newVals={newValue}
                                        saveAndClose={saveAndClose}
      />,
      footer: (
        <div className="button-wrapper">
          <a href="#" className="button positive"
             onClick={saveAndClose}
          >
            {i18n.t("common:save")}
          </a>
          <a href="#" className="button neutral"
             onClick={() => ActionCreator.closeOverlay()}
          >
            {i18n.t("common:cancel")}
          </a>
        </div>
      ),
      type: "flexible"
    });
  }
};

export default pasteCellValue;
