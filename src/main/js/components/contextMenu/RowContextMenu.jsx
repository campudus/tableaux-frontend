import React from "react";
import {translate} from "react-i18next";
import ActionCreator from "./../../actions/ActionCreator";
import {noPermissionAlertWithLanguage} from "../overlay/ConfirmationOverlay";
import {getUserLanguageAccess, isUserAdmin} from "../../helpers/accessManagementHelper";
import {initiateDeleteRow, initiateRowDependency, initiateEntityView} from "../../helpers/rowHelper";
import GenericContextMenu from "./GenericContextMenu";
import {ColumnKinds} from "../../constants/TableauxConstants";
import {compose, isEmpty, eq} from "lodash/fp";
import {canConvert} from "../../helpers/cellValueConverter";

//Distance between clicked coordinate and the left upper corner of the context menu
const CLICK_OFFSET = 3;

class RowContextMenu extends React.Component {

  constructor(props) {
    super(props)
    console.log("RowContextMenu", props)
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
    const {props:{row}, closeRowContextMenu} = this;
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
    && pasteFrom.cell
    && canConvert(pasteFrom.cell.kind, cell.kind)
    && !isEmpty(pasteFrom)
    && !eq(cell, pasteFrom.cell))
      ? (
        <a href="#" onClick={compose(this.closeRowContextMenu, () => ActionCreator.pasteCellContent(cell, langtag))}>
          {t("paste_cell")}
        </a>
      )
      : null;
  };

  render = () => {
    const {duplicateRow, showTranslations, deleteRow, showDependency, showEntityView, props:{t}} = this;

    return (
      <GenericContextMenu x={this.props.x}
                          y={this.props.y - this.props.offsetY}
                          offset={CLICK_OFFSET} menuItems=
                            {<div>
                              {this.props.table.type === 'settings' ? '' : <a href="#" onClick={duplicateRow}>{t(
                                  'duplicate_row')}</a>}
                              {this.copyItem()}
                              {this.pasteItem()}
                              <a href="#" onClick={showTranslations}>{t('show_translation')}</a>
                              <a href="#" onClick={showDependency}>{t('show_dependency')}</a>
                              {this.props.table.type === 'settings' ? '' : <a href="#" onClick={deleteRow}>{t(
                                  'delete_row')}</a>}
                              {this.props.table.type === 'settings' ? '' : <a href="#" onClick={showEntityView}>{t(
                                  'show_entity_view')}</a>}
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

export default translate(['table'])(RowContextMenu);