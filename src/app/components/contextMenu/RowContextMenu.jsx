import { compose } from "recompose";
import { translate } from "react-i18next";
import React from "react";
import f from "lodash/fp";
import withClickOutside from "react-onclickoutside";

import PropTypes from "prop-types";

import { ColumnKinds, Langtags } from "../../constants/TableauxConstants";
import { config } from "../../constants/TableauxConstants";
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
  canUserEditRowAnnotations,
  canUserEditCellAnnotations,
  canUserCreateRow,
  canUserDeleteRow
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
import pasteCellValue from "../../components/cells/cellCopyHelper";

// Distance between clicked coordinate and the left upper corner of the context menu
const CLICK_OFFSET = 3;
const translationNeverNeeded = cell =>
  f.contains(cell.kind, [
    ColumnKinds.currency,
    ColumnKinds.link,
    ColumnKinds.attachment,
    ColumnKinds.concat,
    ColumnKinds.status
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
    initiateDuplicateRow({
      ...cell,
      cell,
      tableId: table.id,
      rowId: row.id,
      langtag
    });
    this.closeRowContextMenu();
  };

  showDependency = () => {
    const {
      cell: { table },
      cell,
      row,
      langtag
    } = this.props;
    initiateRowDependency({ table, row, langtag, cell });
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
    return table.type !== "settings" && !f.contains(cell.kind, [ColumnKinds.concat, ColumnKinds.status])
      ? this.mkItem(
          () => actions.copyCellValue({ cell, langtag }),
          "copy_cell",
          "files-o"
        )
      : null;
  };

  pasteItem = () => {
    const { cell, table, copySource, langtag } = this.props;
    return table.type !== "settings" &&
      copySource &&
      !f.isEmpty(copySource) &&
      canConvert(copySource.cell.kind, cell.kind) &&
      !f.eq(cell.id, copySource.cell.id)
      ? this.mkItem(
          () =>
            pasteCellValue(copySource.cell, copySource.langtag, cell, langtag),
          "paste_cell",
          "clipboard"
        )
      : null;
  };

  canTranslate = cell => {
    const { langtag } = this.props;
    return (
      cell.column.multilanguage &&
      !translationNeverNeeded(cell) &&
      canUserChangeCell(cell, langtag)
    );
  };

  requestTranslationsItem = () => {
    const { langtag, cell, t } = this.props;
    const translationNeededLangtags = f.get(
      ["annotations", "translationNeeded", "langtags"],
      cell
    );
    if (
      !this.canTranslate(cell) ||
      f.contains(langtag, translationNeededLangtags)
    ) {
      return null;
    }
    const isPrimaryLanguage = langtag === f.first(Langtags);
    const neededTranslations = isPrimaryLanguage
      ? f.drop(1)(Langtags)
      : [langtag];
    if (
      isPrimaryLanguage &&
      f.isEmpty(f.xor(neededTranslations, translationNeededLangtags))
    ) {
      // all langs need translation
      return null;
    }
    const fn = () => addTranslationNeeded(neededTranslations, cell);
    return this.mkItem(
      fn,
      isPrimaryLanguage
        ? "translations.translation_needed"
        : t("translations.this_translation_needed", { langtag }),
      "",
      isPrimaryLanguage && !f.isEmpty(translationNeededLangtags)
        ? "dot translation"
        : "dot translation inactive"
    );
  };

  removeTranslationNeededItem = () => {
    const { langtag, cell, t } = this.props;
    const isPrimaryLanguage = langtag === f.first(Langtags);
    const neededTranslations = f.prop(
      ["annotations", "translationNeeded", "langtags"],
      cell
    );
    if (
      !this.canTranslate(cell) ||
      (!f.contains(langtag, neededTranslations) && !isPrimaryLanguage) ||
      (isPrimaryLanguage &&
        !f.isEmpty(f.xor(neededTranslations, f.drop(1)(Langtags))))
    ) {
      return null;
    }
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
    return this.mkItem(
      fn,
      isPrimaryLanguage
        ? t("translations.no_translation_needed")
        : t("translations.this_translation_needed", { langtag }),
      "",
      "dot translation active"
    );
  };

  toggleFlagItem = flag => {
    const { cell } = this.props;
    if (!canUserEditCellAnnotations(cell)) {
      return;
    }
    const existingAnnotation = f.get(["annotations", flag], cell);
    const toggleFn = existingAnnotation
      ? () =>
          deleteCellAnnotation(
            { type: "flag", value: flag, uuid: existingAnnotation },
            cell,
            "do-it!"
          )
      : () => setCellAnnotation({ type: "flag", value: flag }, cell);
    return this.mkItem(
      toggleFn,
      flag,
      "",
      `dot ${flag} ${existingAnnotation ? "active" : "inactive"}`
    );
  };

  setFinal = valueToSet => () => {
    const {
      row,
      cell: { table }
    } = this.props;
    setRowFinal({ table, row, value: valueToSet });
  };

  setFinalItem = () => {
    if (!canUserEditRowAnnotations(this.props.cell)) {
      return null;
    }
    const {
      t,
      cell: {
        row: { final }
      }
    } = this.props;
    const label = final ? t("final.set_not_final") : t("final.set_final");
    return this.mkItem(this.setFinal(!final), label, "lock");
  };

  openLinksFilteredItem = () => {
    const { cell, langtag } = this.props;
    if (cell.kind !== ColumnKinds.link || f.isEmpty(cell.value)) {
      return null;
    }
    const linkedIds = f.join(":", cell.value.map(f.get("id")));
    const toTable = cell.column.toTable;
    const url = `/${langtag}/tables/${toTable}?filter:id:${linkedIds}`;
    const doOpen = () => {
      window.open(url);
    };
    return this.mkItem(doOpen, "table:open-link-filtered", "external-link");
  };

  mkItem = (action, label, icon, classes = "") => {
    return (
      <a
        href="#"
        onClick={f.compose(
          this.closeRowContextMenu,
          action
        )}
      >
        <i className={`fa fa-${icon} ${classes}`} />
        <div className="item-label">{this.props.t(label)}</div>
      </a>
    );
  };

  render = () => {
    const {
      duplicateRow,
      showTranslations,
      deleteRow,
      showDependency,
      showEntityView,
      props: {
        cell,
        t,
        cell: {
          table,
          row: { final }
        }
      },
      closeRowContextMenu
    } = this;

    return (
      <div className="prevent-scroll" onClick={closeRowContextMenu}>
        <GenericContextMenu
          x={this.props.x}
          y={this.props.y - 60}
          offset={CLICK_OFFSET}
          minWidth={230}
        >
          <div className="separator">{t("cell")}</div>
          {this.openLinksFilteredItem()}
          {this.copyItem()}
          {this.pasteItem()}
          {canUserEditCellAnnotations(cell)
            ? this.mkItem(
                () => this.props.openAnnotations(cell),
                "add-comment",
                "commenting"
              )
            : null}
          {f.any(
            f.complement(f.isEmpty),
            f.props(["info", "error", "warning"], cell.annotations)
          )
            ? this.mkItem(
                () => this.props.openAnnotations(cell),
                "show-comments",
                "commenting-o"
              )
            : null}
          {config.enableHistory &&
          !f.contains(this.props.cell.kind, [
            ColumnKinds.group,
            ColumnKinds.concat,
            ColumnKinds.status
          ])
            ? this.mkItem(this.showHistory, "history:show_history", "clock-o")
            : null}
          {this.requestTranslationsItem()}
          {this.removeTranslationNeededItem()}
          {this.toggleFlagItem("important")}
          {this.toggleFlagItem("check-me")}
          {this.toggleFlagItem("postpone")}

          <div className="separator with-line">{t("menus.data_set")}</div>
          {this.props.table.type === "settings"
            ? ""
            : this.mkItem(showEntityView, "show_entity_view", "server")}
          {this.props.table.type === "settings" || !canUserCreateRow({ table })
            ? ""
            : this.mkItem(duplicateRow, "duplicate_row", "clone")}
          {this.props.table.type === "settings" ||
          !canUserDeleteRow({ table }) ||
          final
            ? ""
            : this.mkItem(deleteRow, "delete_row", "trash-o")}
          {this.mkItem(showDependency, "show_dependency", "code-fork")}
          {this.mkItem(showTranslations, "show_translation", "flag")}
          {this.setFinalItem()}
        </GenericContextMenu>
      </div>
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
