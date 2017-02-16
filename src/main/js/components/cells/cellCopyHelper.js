import * as f from "lodash/fp";
import ActionCreator from "../../actions/ActionCreator";
import {ColumnKinds} from "../../constants/TableauxConstants";
import {spy, maybe} from "../../helpers/monads";
import {convert, canConvert} from "../../helpers/cellValueConverter";
import React from "react";
import i18n from "i18next";

const canCopySafely = (src, dst) => !src.isMultiLanguage
  || (src.isMultiLanguage && !dst.isMultiLanguage);

const calcNewValue = function (src, dst) {
  if (!src.isMultiLanguage && !dst.isMultiLanguage) {
    return spy(src.value, "single => single");
  }
  else if (src.isMultiLanguage && dst.isMultiLanguage) {
    const combinedLangtags = f.uniq([...f.keys(src.value), ...f.keys(dst.value)]);
    return spy(f.reduce((result, langtag) => f.assoc(langtag, maybe(src.value[langtag]).getOrElse(null), result),
      {}, combinedLangtags), "multi => multi");
  }
  else if (dst.isMultiLanguage) { // set only current langtag's value of dst to src value
    return spy(f.assoc(this.props.langtag, src.value, dst.value), "single => multi");
  }
  else { // src.isMultiLanguage
    /* const findCommonValue = f.compose(
      f.first,
      filtered => (f.every(f.eq(f.first(filtered)), filtered)) ? filtered : null,
      f.filter(val => !f.isEmpty(val)),
      f.values
    );
    const value = findCommonValue(src.value);
    return spy((value && value !== "")
      ? value
      : null, "multi => single"); */

    return spy( src.value[this.props.langtag], "multi => single");
  }
};

const pasteCellValue = function(src, dst) {
  const canCopyLinks = dst => dst.column.id === src.column.id
  && dst.tableId === src.tableId;

  if (!canConvert(src.kind, dst.kind)) {
    ActionCreator.showToast(<div id="cell-jump-toast">{i18n.t("table:copy_kind_error")}</div>, 3000);
    return;
  }

  if (dst.kind === ColumnKinds.link && !canCopyLinks(dst)) { // only copy same cell type or links from same column
    ActionCreator.showToast(<div id="cell-jump-toast">{i18n.t("table:copy_links_error")}</div>, 3000);
    return;
  }

  if (canCopySafely(src, dst)) {
    const newValue = convert(src.kind, dst.kind, calcNewValue.call(this, src, dst));
    if (!newValue) {
      ActionCreator.showToast(
        <div id="cell-jump-toast">{i18n.t("table:copy_no_conversion_result")}</div>, 3000
      );
      return;
    }
    ActionCreator.changeCell(dst, newValue);
  }
  else {
    const newValue = convert(src.kind, dst.kind,
      (dst.kind === "link")
        ? src.value
        : calcNewValue.call(this, src, dst));
    if (!newValue) {
      ActionCreator.showToast(
        <div id="cell-jump-toast">{i18n.t("table:copy_no_conversion_result")}</div>, 3000
      );
      return;
    }
    ActionCreator.openOverlay({
      head: <div className="overlay-header">{i18n.t("table:confirm_copy.header")}</div>,
      body: (
        <div id="confirm-copy-overlay-content" className="confirmation-overlay">
          <div className="info-text">{i18n.t("table:confirm_copy.info")}</div>
        </div>
      ),
      footer: (
        <div className="button-wrapper">
          <a href="#" className="button positive"
             onClick={() => {
               ActionCreator.changeCell(dst, newValue);
               ActionCreator.closeOverlay();
             }}
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
    })
  }
};

export default pasteCellValue;
