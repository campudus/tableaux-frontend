import React from "react";
import { translate } from "react-i18next";
import { isUserAdmin } from "../../helpers/accessManagementHelper";
import {
  initiateDeleteRow,
  initiateDuplicateRow,
  initiateEntityView,
  initiateRowDependency
} from "../../helpers/rowHelper";
import GenericContextMenu from "./GenericContextMenu";
import { ColumnKinds, Langtags } from "../../constants/TableauxConstants";
import f from "lodash/fp";
import { canConvert } from "../../helpers/cellValueConverter";
import {
  addTranslationNeeded,
  deleteCellAnnotation,
  getAnnotation,
  removeTranslationNeeded,
  setCellAnnotation,
  setRowAnnotation
} from "../../helpers/annotationHelper";
import { compose } from "recompose";
import withClickOutside from "react-onclickoutside";
import PropTypes from "prop-types";

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
    console.log(props);
  }
  closeRowContextMenu = () => {
    this.props.onClickOutside();
  };

  handleClickOutside() {
    this.props.onClickOutside();
  }

  deleteRow = event => {
    const { row, langtag } = this.props;
    this.closeRowContextMenu();
    initiateDeleteRow(row, langtag);
  };

  showTranslations = () => {
    const {
      props: { row, actions },
      closeRowContextMenu
    } = this;
    actions.toggleExpandedRow({ rowId: row.id });
    closeRowContextMenu();
  };

  duplicateRow = event => {
    const { row, langtag } = this.props;
    initiateDuplicateRow(row, langtag);
    this.closeRowContextMenu();
  };

  showDependency = event => {
    const { row, langtag } = this.props;
    initiateRowDependency(row, langtag);
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
    const { cell, table, langtag } = this.props;
    return table.type !== "settings" && cell.kind !== ColumnKinds.concat
      ? this.mkItem(
          f.noop, //() => ActionCreator.copyCellContent(cell, langtag),
          "copy_cell",
          "files-o"
        )
      : null;
  };

  pasteItem = () => {
    const { cell, table, pasteFrom, langtag } = this.props;
    return table.type !== "settings" &&
      pasteFrom &&
      canConvert(pasteFrom.kind, cell.kind) &&
      !f.isEmpty(pasteFrom) &&
      !f.eq(cell, pasteFrom)
      ? this.mkItem(
          f.noop, //() => ActionCreator.pasteCellContent(cell, langtag),
          "paste_cell",
          "clipboard"
        )
      : null;
  };

  canTranslate = cell =>
    cell.column.multilanguage &&
    /*cell.isEditable &&*/ !translationNeverNeeded(cell);

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
    const translationNeeded = f.merge(
      {
        type: "flag",
        value: "translationNeeded"
      },
      cell.annotations.translationNeeded
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
    const flagValue = f.get(["annotations", flag], cell);
    const toggleFn = flagValue
      ? () =>
          deleteCellAnnotation(
            { type: "flag", value: flag, uuid: flagValue },
            cell,
            "do-it!"
          )
      : () => setCellAnnotation({ type: "flag", value: flag }, cell);
    return this.mkItem(
      toggleFn,
      flag,
      "",
      `dot ${flag} ${flagValue ? "active" : "inactive"}`
    );
  };

  setFinal = isFinal => () => {
    const {
      cell: { row }
    } = this.props;
    setRowAnnotation({ final: isFinal }, row);
  };

  setFinalItem = () => {
    if (!isUserAdmin()) {
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
      props: { cell, t }
    } = this;
    try {
      return (
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
          {this.mkItem(
            f.noop, //() => ActionCreator.openAnnotationsPopup(cell),
            "add-comment",
            "commenting"
          )}
          {f.any(
            f.complement(f.isEmpty),
            f.props(["info", "error", "warning"], cell.annotations)
          )
            ? this.mkItem(
                f.noop, //() => ActionCreator.openAnnotationsPopup(cell),
                "show-comments",
                "commenting-o"
              )
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
          {this.props.table.type === "settings"
            ? ""
            : this.mkItem(duplicateRow, "duplicate_row", "clone")}
          {this.props.table.type === "settings"
            ? ""
            : this.mkItem(deleteRow, "delete_row", "trash-o")}
          {this.mkItem(showDependency, "show_dependency", "code-fork")}
          {this.mkItem(showTranslations, "show_translation", "flag")}
          {this.setFinalItem()}
        </GenericContextMenu>
      );
    } catch (err) {
      return <div className="FAILED_CONTEXTMENU">EMPTY</div>;
    }
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
  onClickOutside: PropTypes.func.isRequired
};

export default compose(
  translate(["table"]),
  withClickOutside
)(RowContextMenu);
