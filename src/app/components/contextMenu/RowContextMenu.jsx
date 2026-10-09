import f from "lodash/fp";
import PropTypes from "prop-types";
import React from "react";
import { translate } from "react-i18next";
import withClickOutside from "react-onclickoutside";
import pasteCellValue from "../../components/cells/cellCopyHelper";
import { ColumnKinds, config } from "../../constants/TableauxConstants";
import {
  canUserChangeCell,
  canUserCreateRow,
  canUserDeleteRow,
  canUserEditCellAnnotations,
  canUserEditRowAnnotations
} from "../../helpers/accessManagementHelper";
import { setRowArchived, setRowFinal } from "../../helpers/annotationHelper";
import { urlToTableDestination } from "../../helpers/apiUrl";
import { canConvert } from "../../helpers/cellValueConverter";
import { hasHistory } from "../../helpers/history";
import { isTextInRange } from "../../helpers/limitTextLength";
import {
  initiateDeleteRow,
  initiateDuplicateRow,
  initiateEntityView,
  initiateRowDependency
} from "../../helpers/rowHelper";
import { getCssVarNumeric } from "../../helpers/getCssVar";
import T from "../../helpers/table";
import { clearSelectedCellValue } from "../../redux/actions/cellActions";
import ContextMenuServices from "../frontendService/ContextMenuEntries";
import SvgIcon from "../helperComponents/SvgIcon";
import { openHistoryOverlay } from "../history/HistoryOverlay";
import AnnotationContextMenu from "./AnnotationContextMenu";
import GenericContextMenu from "./GenericContextMenu";
import { previewUrl } from "../../helpers/apiUrl";

//  Distance between clicked coordinate and the left upper corner of the context menu
const CLICK_OFFSET = 3;

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
    return table.type !== "settings" &&
      !f.contains(cell.kind, [ColumnKinds.concat, ColumnKinds.status])
      ? this.mkItem(
          () => actions.copyCellValue({ cell, langtag }),
          "copy_cell",
          "files-o",
          "context-menu-copy-cell"
        )
      : null;
  };

  pasteItem = () => {
    const { cell, table, copySource, langtag } = this.props;
    const isCopySourceMultiLanguage = f.get(
      ["cell", "column", "multilanguage"],
      copySource
    );
    const copySourceValue = isCopySourceMultiLanguage
      ? f.get(["cell", "value", langtag], copySource)
      : f.get(["cell", "value"], copySource);
    return table.type !== "settings" &&
      copySource &&
      canUserChangeCell(cell, langtag) &&
      !f.isEmpty(copySource) &&
      canConvert(copySource.cell.kind, cell.kind) &&
      !f.eq(cell.id, copySource.cell.id) &&
      isTextInRange(cell.column, copySourceValue)
      ? this.mkItem(
          () =>
            pasteCellValue(copySource.cell, copySource.langtag, cell, langtag),
          "paste_cell",
          "clipboard",
          "context-menu-paste-cell"
        )
      : null;
  };

  setFinal = valueToSet => () => {
    const {
      row,
      cell: { table }
    } = this.props;
    setRowFinal({ table, row, value: valueToSet });
  };

  setArchived = archived => () => {
    const {
      langtag,
      cell: { row, table }
    } = this.props;
    setRowArchived({ table, row, archived });
    if (archived) {
      this.props.actions.toggleCellSelection({
        select: false,
        langtag,
        tableId: table.id
      });
    }
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
    return this.mkItem(
      this.setFinal(!final),
      label,
      "lock",
      "context-menu-toggle-final"
    );
  };

  setArchivedItem = () => {
    if (!canUserEditRowAnnotations(this.props.cell)) {
      return null;
    } else {
      const {
        t,
        cell: {
          row: { archived }
        }
      } = this.props;
      const label = t(
        archived ? "archived.unset-archived" : "archived.set-archived"
      );
      return this.mkItem(
        this.setArchived(!archived),
        label,
        "archive",
        "context-menu-toggle-archived"
      );
    }
  };

  openLinksFilteredItem = () => {
    const { cell, langtag } = this.props;
    if (cell.kind !== ColumnKinds.link || f.isEmpty(cell.value)) {
      return null;
    }
    const linkedIds = f.join(":", cell.value.map(f.get("id")));
    const toTable = cell.column.originColumn?.toTable ?? cell.column.toTable;
    const url = `/${langtag}/tables/${toTable}?filter:id:${linkedIds}`;
    const doOpen = () => {
      window.open(url);
    };
    return this.mkItem(
      doOpen,
      "table:open-link-filtered",
      "external-link",
      "context-menu-open-links-filtered"
    );
  };

  clearCellValue = () => {
    const { cell, langtag } = this.props;
    const doClear = () => {
      clearSelectedCellValue(cell, langtag);
    };
    return canUserChangeCell(cell, langtag) &&
      cell.column.kind !== ColumnKinds.group
      ? this.mkItem(
          doClear,
          "table:clear-cell.title",
          "times",
          "context-menu-clear-cell"
        )
      : null;
  };

  mkItem = (action, label, icon, testId) => {
    return (
      <button
        onClick={f.compose(this.closeRowContextMenu, action)}
        data-testid={testId}
      >
        <i className={`fa fa-${icon}`} />
        <div className="item-label">{this.props.t(label)}</div>
      </button>
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
          row: { final },
          column: { originColumn }
        }
      },
      closeRowContextMenu
    } = this;
    const isSettingsTable = table.type === "settings";

    const isDeletingRowAllowed =
      !isSettingsTable && canUserDeleteRow({ table }) && !final;

    const isDuplicatingRowAllowed =
      !isSettingsTable && canUserCreateRow({ table });

    return (
      <div className="prevent-scroll" onClick={closeRowContextMenu}>
        <GenericContextMenu
          x={this.props.x}
          y={this.props.y - 60}
          offset={CLICK_OFFSET}
          minWidth={getCssVarNumeric("--context-menu-min-width")}
        >
          <div className="separator">{t("cell")}</div>
          {this.openLinksFilteredItem()}
          {this.copyItem()}
          {this.pasteItem()}
          {this.clearCellValue()}
          {canUserEditCellAnnotations(cell)
            ? this.mkItem(
                () => this.props.openAnnotations(cell),
                "add-comment",
                "commenting",
                "context-menu-add-comment"
              )
            : null}
          {f.any(
            f.complement(f.isEmpty),
            f.props(["info", "error", "warning"], cell.annotations)
          )
            ? this.mkItem(
                () => this.props.openAnnotations(cell),
                "show-comments",
                "commenting-o",
                "context-menu-show-comments"
              )
            : null}
          {config.enableHistory && hasHistory(cell)
            ? this.mkItem(
                this.showHistory,
                "history:show_history",
                "clock-o",
                "context-menu-show-history"
              )
            : null}
          {canUserEditCellAnnotations(cell) && (
            <a
              className="annotation-context-menu-button"
              data-testid="context-menu-highlight"
            >
              <SvgIcon icon="highlight" />
              <div className="item-label">
                {this.props.t("show-annotations")}
              </div>
              <i className="fa fa-chevron-right" />
              <AnnotationContextMenu
                cell={cell}
                langtag={this.props.langtag}
                closeAction={this.closeRowContextMenu}
              />
            </a>
          )}
          <ContextMenuServices cell={cell} langtag={this.props.langtag} />
          <div className="separator with-line">{t("menus.data_set")}</div>
          {T.isUnionTable(this.props.table) ? (
            <a
              target="_blank"
              rel="noopener noreferrer"
              href={urlToTableDestination({
                langtag: this.props.langtag,
                table: { id: cell.row.tableId },
                column: originColumn,
                row: { id: T.getOriginRowId(cell.row) }
              })}
              data-testid="context-menu-open-dataset"
            >
              <i className="fa fa-external-link" />
              <div className="item-label">{t("open-dataset")}</div>
            </a>
          ) : null}
          {this.props.table.type === "settings"
            ? ""
            : this.mkItem(
                showEntityView,
                "show_entity_view",
                "server",
                "context-menu-show-entity-view"
              )}
          {!T.isUnionTable(this.props.cell.table)
            ? this.mkItem(
                showDependency,
                "show_dependency",
                "code-fork",
                "context-menu-show-dependency"
              )
            : null}
          {this.mkItem(
            showTranslations,
            "show_translation",
            "flag",
            "context-menu-show-translations"
          )}
          <a
            href={previewUrl({
              langtag: this.props.langtag,
              tableId: T.isUnionTable(table) ? cell.row.tableId : table.id,
              rowId: T.isUnionTable(table)
                ? T.getOriginRowId(cell.row)
                : cell.row.id
            })}
            target="_blank"
            rel="noopener noreferrer"
            data-testid="context-menu-open-preview"
          >
            <i className="fa fa-eye" />
            <div className="item-label">{t("preview:open_preview_view")}</div>
          </a>
          {this.setFinalItem()}
          {this.setArchivedItem()}
          {isDeletingRowAllowed || isDuplicatingRowAllowed ? (
            <div className="separator--internal" />
          ) : null}
          {isDuplicatingRowAllowed
            ? this.mkItem(
                duplicateRow,
                "duplicate_row",
                "clone",
                "context-menu-duplicate-row"
              )
            : null}
          {isDeletingRowAllowed
            ? this.mkItem(
                deleteRow,
                "delete_row",
                "trash-o",
                "context-menu-delete-row"
              )
            : null}
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

export default translate(["table"])(withClickOutside(RowContextMenu));
