import * as f from "lodash/fp";
import ActionCreator from "../../actions/ActionCreator";
import {ColumnKinds} from "../../constants/TableauxConstants";
import {maybe} from "../../helpers/monads";
import {convert, canConvert} from "../../helpers/cellValueConverter";
import React from "react";
import i18n from "i18next";
import PasteMultilanguageCellInfo from "../overlay/PasteMultilanguageCellInfo";

const showErrorToast = msg => {
  ActionCreator.showToast(<div id="cell-jump-toast">{i18n.t(msg)}</div>, 3000);
};

const canCopySafely = (src, dst) => !src.isMultiLanguage || (src.isMultiLanguage && !dst.isMultiLanguage);
const canCopyLinks = (src, dst) => dst.column.id === src.column.id && dst.tableId === src.tableId;


const calcNewValue = function (src, srcLang, dst, dstLang) {
  if (!src.isMultiLanguage && !dst.isMultiLanguage) {
    return convert(src.kind, dst.kind, src.value);
  } else if (src.isMultiLanguage && dst.isMultiLanguage) {
    const combinedLangtags = f.uniq([...f.keys(src.value), ...f.keys(dst.value)]);
    const result =
      f.reduce((result, langtag) => f.assoc(langtag,
        convert(src.kind, dst.kind, maybe(src.value[langtag]).getOrElse(null)), result),
        {}, combinedLangtags);
    return (f.any(
      tag => result[tag] != null && (!f.isString(result[tag]) || !f.isEmpty(result[tag])),
      combinedLangtags)
    )
      ? result
      : null;
  } else if (dst.isMultiLanguage) { // set only current langtag's value of dst to src value
    return f.assoc(dstLang, convert(src.kind, dst.kind, src.value), dst.value);
  } else { // src.isMultiLanguage
    return convert(src.kind, dst.kind, src.value[srcLang]);
  }
};

const pasteCellValue = function (src, srcLang, dst, dstLang) {
  if (dst.kind === ColumnKinds.link && src.kind === ColumnKinds.link) {
    if (canCopyLinks(src, dst)) {
      ActionCreator.changeCell(dst, src.value);
    } else {
      showErrorToast("table:copy_links_error");
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
                                        kind={dst.kind}
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
