import { compose, withProps } from "recompose";
import { translate } from "react-i18next";
import React from "react";
import f from "lodash/fp";
import withClickOutside from "react-onclickoutside";

import PropTypes from "prop-types";

import { ColumnKinds, Langtags } from "../../constants/TableauxConstants";
import {
  addTranslationNeeded,
  deleteCellAnnotation,
  getAnnotation,
  removeTranslationNeeded,
  setCellAnnotation,
  setRowFinal
} from "../../helpers/annotationHelper";
import { canConvert } from "../../helpers/cellValueConverter";
import {
  canUserChangeCell,
  canUserDeleteRow,
  canUserDuplicateRows,
  canUserEditCellAnnotations,
  canUserEditRowAnnotations
} from "../../helpers/accessManagementHelper";
import {
  initiateDeleteRow,
  initiateDuplicateRow,
  initiateEntityView,
  initiateRowDependency
} from "../../helpers/rowHelper";
import { merge } from "../../helpers/functools";
import { openHistoryOverlay } from "../history/HistoryOverlay";
import GenericContextMenu from "./GenericContextMenu";
import ContextMenuItem from "./ContextMenuItem";
import pasteCellValue from "../../components/cells/cellCopyHelper";

// Distance between clicked coordinate and the left upper corner of the context menu
const CLICK_OFFSET = 3;
const translationNeverNeeded = cell =>
  f.contains(cell.kind, [
    ColumnKinds.currency,
    ColumnKinds.link,
    ColumnKinds.attachment,
    ColumnKinds.concat
  ]);

class RowContextMenu extends React.Component {
  constructor(props) {
    super(props);
  }
  closeRowContextMenu = () => {
    this.props.onClickOutside();
  };

  handleClickOutside() {
    this.props.onClickOutside();
  }

  showHistory = () => {
    const { cell, langtag } = this.props;
    // Scroll selected cell to the left so it's visible beneath the overlay
    this.props.actions.toggleCellSelection({
      columnId: cell.column.id,
      rowId: cell.row.id,
      tableId: cell.table.id,
      langtag,
      align: "start",
      select: true
    });
    openHistoryOverlay({ cell, langtag });
  };

  deleteRow = () => {
    const { cell, row, langtag } = this.props;
    initiateDeleteRow({ row, table: cell.table, langtag });
  };

  showTranslations = () => {
    const {
      props: { row, actions },
      closeRowContextMenu
    } = this;
    actions.toggleExpandedRow({ rowId: row.id });
    closeRowContextMenu();
  };

  duplicateRow = () => {
    const {
      row,
      langtag,
      cell,
      cell: { table }
    } = this.props;
    initiateDuplicateRow({ cell, tableId: table.id, rowId: row.id, langtag });
    this.closeRowContextMenu();
  };

  showDependency = () => {
    const {
      cell: { table },
      row,
      langtag
    } = this.props;
    initiateRowDependency({ table, row, langtag });
    this.closeRowContextMenu();
  };

  showEntityView = () => {
    const { row, langtag, cell, rows } = this.props;
    initiateEntityView({
      columnId: cell.column.id,
      langtag,
      row,
      rows,
      table: cell.table
    });
    this.closeRowContextMenu();
  };

  copyItem = () => {
    const { actions, cell, table, langtag } = this.props;
    const isValidCopySource =
      table.type !== "settings" && cell.kind !== ColumnKinds.concat;
    return {
      itemAction: isValidCopySource
        ? () => actions.copyCellValue({ cell, langtag })
        : null,
      label: "copy_cell",
      icon: "files-o"
    };
  };

  pasteItem = () => {
    const { cell, copySource, langtag } = this.props;
    const canPaste =
      canUserChangeCell(cell) &&
      copySource &&
      !f.isEmpty(copySource) &&
      canConvert(copySource.cell.kind, cell.kind) &&
      !f.eq(cell.id, copySource.cell.id);
    return {
      itemAction: canPaste
        ? () =>
            pasteCellValue(copySource.cell, copySource.langtag, cell, langtag)
        : null,
      label: "paste_cell",
      icon: "clipboard"
    };
  };

  canTranslate = cell =>
    cell.column.multilanguage &&
    !translationNeverNeeded(cell) &&
    canUserChangeCell(cell);

  requestTranslationsItem = () => {
    const { langtag, cell } = this.props;
    const translationNeededLangtags = f.get(
      ["annotations", "translationNeeded", "langtags"],
      cell
    );
    const cannotSetFlags =
      !this.canTranslate(cell) ||
      f.contains(langtag, translationNeededLangtags);
    const isPrimaryLanguage = langtag === f.first(Langtags);
    const neededTranslations = isPrimaryLanguage
      ? f.drop(1)(Langtags)
      : [langtag];
    const areAllFlagsSet =
      isPrimaryLanguage &&
      f.isEmpty(f.xor(neededTranslations, translationNeededLangtags));
    const fn = () => addTranslationNeeded(neededTranslations, cell);
    return {
      hide: areAllFlagsSet || cannotSetFlags,
      itemAction: fn,
      label: isPrimaryLanguage
        ? "translations.translation_needed"
        : ["translations.this_translation_needed", { langtag }],
      iconClass:
        isPrimaryLanguage && !f.isEmpty(translationNeededLangtags)
          ? "dot translation"
          : "dot translation inactive"
    };
  };

  removeTranslationNeededItem = () => {
    const { langtag, cell } = this.props;
    const isPrimaryLanguage = langtag === f.first(Langtags);
    const neededTranslations = f.prop(
      ["annotations", "translationNeeded", "langtags"],
      cell
    );
    const cannotRemoveFlags =
      !this.canTranslate(cell) ||
      (!f.contains(langtag, neededTranslations) && !isPrimaryLanguage) ||
      (isPrimaryLanguage &&
        !f.isEmpty(f.xor(neededTranslations, f.drop(1)(Langtags))));
    const annotations = f.propOr({}, cell);
    const translationNeeded = merge(
      {
        type: "flag",
        value: "translationNeeded"
      },
      annotations.translationNeeded
    );
    const remainingLangtags = f.remove(
      f.eq(langtag),
      f.prop("langtags", getAnnotation(translationNeeded, cell))
    );

    const fn =
      isPrimaryLanguage || f.isEmpty(remainingLangtags)
        ? () => deleteCellAnnotation(translationNeeded, cell, true)
        : () => removeTranslationNeeded(langtag, cell);
    return {
      hide: cannotRemoveFlags,
      itemAction: fn,
      label: isPrimaryLanguage
        ? "translations.no_translation_needed"
        : ["translations.this_translation_needed", { langtag }],

      iconClass: "dot translation active"
    };
  };

  toggleFlagItem = flag => {
    const { cell } = this.props;
    const existingAnnotation = f.get(["annotations", flag], cell);
    const toggleFn = existingAnnotation
      ? () =>
          deleteCellAnnotation(
            { type: "flag", value: flag, uuid: existingAnnotation },
            cell,
            "do-it!"
          )
      : () => setCellAnnotation({ type: "flag", value: flag }, cell);
    return {
      itemAction: canUserEditCellAnnotations(cell) ? toggleFn : null,
      label: flag,
      iconClass: `dot ${flag} ${existingAnnotation ? "active" : "inactive"}`
    };
  };

  setFinal = valueToSet => () => {
    const {
      row,
      cell: { table }
    } = this.props;
    setRowFinal({ table, row, value: valueToSet });
  };

  setFinalItem = () => {
    const {
      t,
      cell,
      cell: {
        row: { final }
      }
    } = this.props;
    const label = final ? t("final.set_not_final") : t("final.set_final");
    return {
      itemAction: canUserEditRowAnnotations(cell)
        ? this.setFinal(!final)
        : null,
      label,
      icon: "lock"
    };
  };

  openLinksFilteredItem = () => {
    const { cell, langtag } = this.props;
    const isNoLink = cell.kind !== ColumnKinds.link || f.isEmpty(cell.value);
    const linkedIds = f.compose(
      f.join,
      f.map("id"),
      f.prop("value")
    )(cell);
    const toTable = f.prop(["column", "toTable"], cell);
    const url = `/${langtag}/tables/${toTable}?filter:id:${linkedIds}`;
    const doOpen = () => {
      window.open(url);
    };
    return {
      hide: isNoLink,
      itemAction: doOpen,
      label: "table:open-link-filtered",
      icon: "external-link"
    };
  };

  render = () => {
    const {
      duplicateRow,
      showTranslations,
      deleteRow,
      showDependency,
      showEntityView,
      props: { cell, t }
    } = this;

    const MenuItem = withProps(({ itemAction }) => ({
      t,
      closeMenu: this.closeRowContextMenu,
      enabled: !f.isNil(itemAction),
      itemAction: itemAction || f.noop
    }))(ContextMenuItem);

    return (
      <GenericContextMenu
        x={this.props.x}
        y={this.props.y - 60}
        offset={CLICK_OFFSET}
        minWidth={230}
      >
        <div className="separator">{t("cell")}</div>
        <MenuItem {...this.openLinksFilteredItem()} />
        <MenuItem {...this.copyItem()} />
        <MenuItem {...this.pasteItem()} />
        <MenuItem
          itemAction={() => this.props.openAnnotations(cell)}
          label="add-comment"
          icon="commenting"
        />

        {f.any(
          f.complement(f.isEmpty),
          f.props(["info", "error", "warning"], cell.annotations)
        ) && (
          <MenuItem
            itemAction={() => this.props.openAnnotations(cell)}
            label="show-comments"
            icon="commenting-o"
          />
        )}
        {!f.contains(this.props.cell.kind, [
          ColumnKinds.group,
          ColumnKinds.concat
        ]) && (
          <MenuItem
            itemAction={this.showHistory}
            label="history:show_history"
            icon="clock-o"
          />
        )}
        <MenuItem {...this.requestTranslationsItem()} />
        <MenuItem {...this.removeTranslationNeededItem()} />
        {["important", "check-me", "postpone"].map(flag => (
          <MenuItem key={flag} {...this.toggleFlagItem(flag)} />
        ))}
        <div className="separator">{t("menus.data_set")}</div>
        {this.props.table.type !== "settings" && (
          <MenuItem
            itemAction={showEntityView}
            label="show_entity_view"
            icon="server"
          />
        )}
        {canUserDuplicateRows(cell) && (
          <MenuItem
            itemAction={duplicateRow}
            label="duplicate_row"
            icon="clone"
          />
        )}
        {canUserDeleteRow(cell) && (
          <MenuItem itemAction={deleteRow} label="delete_row" icon="trash-o" />
        )}
        <MenuItem
          itemAction={showDependency}
          label="show_dependency"
          icon="code-fork"
        />
        <MenuItem
          itemAction={showTranslations}
          label="show_translation"
          icon="flag"
        />
        <MenuItem {...this.setFinalItem()} />
      </GenericContextMenu>
    );
  };
}

RowContextMenu.propTypes = {
  x: PropTypes.number.isRequired,
  y: PropTypes.number.isRequired,
  row: PropTypes.object.isRequired,
  offsetY: PropTypes.number,
  langtag: PropTypes.string.isRequired,
  table: PropTypes.object.isRequired,
  cell: PropTypes.object.isRequired,
  actions: PropTypes.object.isRequired,
  onClickOutside: PropTypes.func.isRequired,
  openAnnotations: PropTypes.func.isRequired
};

export default compose(
  translate(["table"]),
  withClickOutside
)(RowContextMenu);
