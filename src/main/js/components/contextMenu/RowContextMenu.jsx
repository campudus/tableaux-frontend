import React from "react";
import {translate} from "react-i18next";
import ActionCreator from "./../../actions/ActionCreator";
import {isUserAdmin} from "../../helpers/accessManagementHelper";
import {
  initiateDeleteRow,
  initiateDuplicateRow,
  initiateEntityView,
  initiateRowDependency
} from "../../helpers/rowHelper";
import GenericContextMenu from "./GenericContextMenu";
import {ColumnKinds, Langtags} from "../../constants/TableauxConstants";
import {compose, contains, drop, eq, first, isEmpty, merge, prop, remove} from "lodash/fp";
import {canConvert} from "../../helpers/cellValueConverter";
import {
  addTranslationNeeded,
  deleteCellAnnotation,
  getAnnotation,
  removeTranslationNeeded,
  setRowAnnotation
} from "../../helpers/annotationHelper";

// Distance between clicked coordinate and the left upper corner of the context menu
const CLICK_OFFSET = 3;
const translationNeverNeeded = cell => contains(cell.kind, [
  ColumnKinds.currency,
  ColumnKinds.link,
  ColumnKinds.attachment,
  ColumnKinds.concat
]);

class RowContextMenu extends React.Component {

  closeRowContextMenu = () => {
    ActionCreator.closeRowContextMenu();
  };

  deleteRow = (event) => {
    const {row, langtag} = this.props;
    this.closeRowContextMenu();
    initiateDeleteRow(row, langtag);
  };

  showTranslations = (event) => {
    const {props: {row}, closeRowContextMenu} = this;
    ActionCreator.toggleRowExpand(row.getId());
    closeRowContextMenu();
  };

  duplicateRow = (event) => {
    const {row, langtag} = this.props;
    initiateDuplicateRow(row, langtag);
    this.closeRowContextMenu();
  };

  showDependency = (event) => {
    const {row, langtag} = this.props;
    initiateRowDependency(row, langtag);
    this.closeRowContextMenu();
  };

  showEntityView = () => {
    const {row, langtag, cell, rows} = this.props;
    initiateEntityView(row, langtag, cell.id, rows);
    this.closeRowContextMenu();
  };

  copyItem = () => {
    const {cell, table, t, langtag} = this.props;
    return (table.type !== "settings" && cell.kind !== ColumnKinds.concat)
      ? this.mkItem(() => ActionCreator.copyCellContent(cell, langtag), "copy_cell", "files-o")
      : null;
  };

  pasteItem = () => {
    const {cell, table, t, pasteFrom, langtag} = this.props;
    return (table.type !== "settings"
    && pasteFrom
    && canConvert(pasteFrom.kind, cell.kind)
    && !isEmpty(pasteFrom)
    && !eq(cell, pasteFrom))
      ? this.mkItem(() => ActionCreator.pasteCellContent(cell, langtag), "paste_cell", "clipboard")
      : null;
  };

  canTranslate = cell => cell.isMultiLanguage && cell.isEditable && !translationNeverNeeded(cell);

  requestTranslationsItem = () => {
    const {langtag, cell, t} = this.props;
    if (!this.canTranslate(cell) || contains(langtag, prop(["annotations", "translationNeeded", "langtags"], cell))) {
      return null;
    }
    const isPrimaryLanguage = langtag === first(Langtags);
    const neededTranslations = (isPrimaryLanguage)
      ? drop(1)(Langtags)
      : [langtag];
    const fn = () => addTranslationNeeded(neededTranslations, cell);
    return this.mkItem(
      fn,
      (isPrimaryLanguage) ? "translations.translation_needed" : t("translations.this_translation_needed", {langtag}),
      "circle",
      "translation dot"
    );
  };

  removeTranslationNeededItem = () => {
    const {langtag, cell, t} = this.props;
    const isPrimaryLanguage = langtag === first(Langtags);
    const neededTranslations = prop(["annotations", "translationNeeded", "langtags"], cell);
    if (!this.canTranslate(cell) || (!contains(langtag, neededTranslations) && !isPrimaryLanguage)) {
      return null;
    }
    const translationNeeded = merge({
      type: "flag",
      value: "translationNeeded"
    }, cell.annotations.translationNeeded);
    const remainingLangtags = remove(eq(langtag), prop("langtags", getAnnotation(translationNeeded, cell)));

    const fn = (isPrimaryLanguage || isEmpty(remainingLangtags))
      ? () => deleteCellAnnotation(translationNeeded, cell, true)
      : () => removeTranslationNeeded(langtag, cell);
    return this.mkItem(
      fn,
      (isPrimaryLanguage) ? t("translations.no_translation_needed") : t("translations.no_such_translation_needed", {langtag}),
      "circle",
      "dot no-translation"
    );
  };

  setFinal = isFinal => () => {
    const {cell: {row}} = this.props;
    setRowAnnotation({final: isFinal}, row);
  };

  setFinalItem = () => {
    if (!isUserAdmin()) {
      return null;
    }
    const {t, cell: {row: {final}}} = this.props;
    const label = (final) ? t("final.set_not_final") : t("final.set_final");
    return this.mkItem(this.setFinal(!final), label, "lock");
  };

  mkItem = (action, label, icon, classes = "") => {
    return (
      <a href="#" onClick={compose(this.closeRowContextMenu, action)}>
        <i className={`fa fa-${icon} ${classes}`} />
        <div className="item-label">
          {this.props.t(label)}
        </div>
      </a>
    );
  };

  render = () => {
    const {duplicateRow, showTranslations, deleteRow, showDependency, showEntityView, props: {t}} = this;
    return (
      <GenericContextMenu x={this.props.x}
                          y={this.props.y - this.props.offsetY}
                          offset={CLICK_OFFSET} menuItems=
                            {<div>
                              <div className="separator">{t("cell")}</div>
                              {this.copyItem()}
                              {this.pasteItem()}
                              {this.requestTranslationsItem()}
                              {this.removeTranslationNeededItem()}

                              <div className="separator with-line">{t("menus.data_set")}</div>
                              {this.props.table.type === "settings"
                                ? ""
                                : this.mkItem(showEntityView, "show_entity_view", "server")}
                              {this.props.table.type === "settings"
                                ? ""
                                : this.mkItem(duplicateRow, "duplicate_row", "clone")}
                              {this.props.table.type === "settings"
                                ? ""
                                : this.mkItem(deleteRow, "delete_row", "trash-o")}
                              {this.mkItem(showDependency, "show_dependency", "code-fork")}
                              {this.mkItem(showTranslations, "show_translation", "flag")}
                              {this.setFinalItem()}
                            </div>
                            }
      />
    );
  }
}

RowContextMenu.propTypes = {
  x: React.PropTypes.number.isRequired,
  y: React.PropTypes.number.isRequired,
  row: React.PropTypes.object.isRequired,
  offsetY: React.PropTypes.number.isRequired,
  langtag: React.PropTypes.string.isRequired,
  table: React.PropTypes.object.isRequired,
  cell: React.PropTypes.object.isRequired
};

export default translate(["table"])(RowContextMenu);
