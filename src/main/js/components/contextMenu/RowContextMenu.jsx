import React from "react";
import {translate} from "react-i18next";
import ActionCreator from "./../../actions/ActionCreator";
import {noPermissionAlertWithLanguage} from "../overlay/ConfirmationOverlay";
import {getUserLanguageAccess, isUserAdmin} from "../../helpers/accessManagementHelper";
import {initiateDeleteRow, initiateRowDependency, initiateEntityView} from "../../helpers/rowHelper";
import GenericContextMenu from "./GenericContextMenu";
import {ColumnKinds, Langtags} from "../../constants/TableauxConstants";
import {first, compose, isEmpty, eq, drop, remove, merge, contains, prop} from "lodash/fp";
import {canConvert} from "../../helpers/cellValueConverter";
import {
  addTranslationNeeded,
  getAnnotation,
  deleteCellAnnotation,
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

  constructor(props) {
    super(props);
    console.log("RowContextMenu", props);
  }

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
    const {row} = this.props;
    if (isUserAdmin()) {
      ActionCreator.duplicateRow(row.tableId, row.getId());
    } else {
      noPermissionAlertWithLanguage(getUserLanguageAccess());
    }
  };

  showDependency = (event) => {
    const {row, langtag} = this.props;
    initiateRowDependency(row, langtag);
    this.closeRowContextMenu();
  };

  showEntityView = () => {
    const {row, langtag} = this.props;
    initiateEntityView(row, langtag);
    this.closeRowContextMenu();
  };

  copyItem = () => {
    const {cell, table, t, langtag} = this.props;
    return (table.type != "settings" && cell.kind !== ColumnKinds.concat)
      ? (
        <a href="#" onClick={compose(this.closeRowContextMenu, () => ActionCreator.copyCellContent(cell, langtag))}>
          {t("copy_cell")}
        </a>
      )
      : null;
  };

  pasteItem = () => {
    const {cell, table, t, pasteFrom, langtag} = this.props;
    return (table.type !== "settings"
    && pasteFrom
    && canConvert(pasteFrom.kind, cell.kind)
    && !isEmpty(pasteFrom)
    && !eq(cell, pasteFrom))
      ? (
        <a href="#" onClick={compose(this.closeRowContextMenu, () => ActionCreator.pasteCellContent(cell, langtag))}>
          {t("paste_cell")}
        </a>
      )
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
    return (
      <a href="#" onClick={compose(this.closeRowContextMenu, fn)}>
        {(isPrimaryLanguage) ? t("translations.translation_needed") : t("translations.this_translation_needed",
            {langtag})}
      </a>
    );
  };

  removeTranslationNeeded = () => {
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
      : () => deleteCellAnnotation(translationNeeded, cell).then(() => addTranslationNeeded(remainingLangtags, cell));
    return (
      <a href="#" onClick={compose(this.closeRowContextMenu, fn)}>
        {(isPrimaryLanguage) ? t("translations.no_translation_needed") : t("translations.no_such_translation_needed",
            {langtag})}
      </a>
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
    return <a href="#" onClick={compose(this.closeRowContextMenu, this.setFinal(!final))}>{label}</a>;
  };

  render = () => {
    const {duplicateRow, showTranslations, deleteRow, showDependency, showEntityView, props: {t}} = this;
    return (
      <GenericContextMenu x={this.props.x}
                          y={this.props.y - this.props.offsetY}
                          offset={CLICK_OFFSET} menuItems=
                            {<div>
                              {this.props.table.type === "settings" ? "" : <a href="#" onClick={duplicateRow}>{t(
                                  "duplicate_row")}</a>}
                              {this.copyItem()}
                              {this.pasteItem()}
                              <a href="#" onClick={showTranslations}>{t("show_translation")}</a>
                              <a href="#" onClick={showDependency}>{t("show_dependency")}</a>
                              {this.props.table.type === "settings" ? "" : <a href="#" onClick={deleteRow}>{t(
                                  "delete_row")}</a>}
                              {this.requestTranslationsItem()}
                              {this.removeTranslationNeeded()}
                              {this.setFinalItem()}
                              {this.props.table.type === "settings" ? "" : <a href="#" onClick={showEntityView}>{t(
                                  "show_entity_view")}</a>}
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
