import classNames from "classnames";
import i18n from "i18next";
import * as f from "lodash/fp";
import PropTypes from "prop-types";
import React, { Component } from "react";
import listenToClickOutside from "react-onclickoutside";
import { isLocked, setRowAnnotation } from "../../../helpers/annotationHelper";
import { openInNewTab } from "../../../helpers/apiUrl";
import { addCellId } from "../../../helpers/getCellId";
import {
  initiateDeleteRow,
  initiateDuplicateRow
} from "../../../helpers/rowHelper";
import SvgIcon from "../../helperComponents/SvgIcon";
import { openShowDependency } from "../ConfirmDependentOverlay";

const CLOSING_TIMEOUT = 300; // ms; time to close popup after mouse left

class HeaderPopupMenu extends Component {
  static propTypes = {
    langtag: PropTypes.string.isRequired,
    grudData: PropTypes.object.isRequired,
    id: PropTypes.number.isRequired
  };

  constructor(props) {
    super(props);
    this.state = {
      open: false
    };
  }

  mkEntry = (id, { title, fn, icon }) => {
    const clickHandler = () => {
      f.isFunction(fn) ? fn() : console.log("handler function:", typeof fn, fn);
      this.setState({ open: false });
    };
    return (
      <button className="entry" onClick={clickHandler}>
        <i className={`fa fa-${icon}`} />
        <div>{i18n.t(title)}</div>
      </button>
    );
  };

  handleClickOutside = () => {
    this.cancelClosingTimer();
    this.setState({ open: false });
  };

  startClosingTimer = () => {
    this.cancelClosingTimer();
    this.timeoutId = window.setTimeout(
      () => this.setState({ open: false }),
      CLOSING_TIMEOUT
    );
  };

  cancelClosingTimer = () => {
    if (!f.isNil(this.timeoutId)) {
      window.clearTimeout(this.timeoutId);
      delete this.timeoutId;
    }
  };

  handleMouseLeave = event => {
    if (event.buttons > 0) {
      return;
    }
    if (this.state.open) {
      this.startClosingTimer();
    }
  };

  handleMouseEnter = event => {
    if (event.buttons > 0) {
      return;
    }
    this.cancelClosingTimer();
    if (!this.state.open) {
      this.setState({ open: true });
    }
  };

  getHistoryView = () => {
    const {
      cell: { row, table }
    } = this.props;
    return {
      tableId: table.id,
      rowId: row.id
    };
  };

  render() {
    const {
      id,
      funcs,
      cell,
      langtag,
      hasMeaningfulLinks,
      grudData,
      actions,
      table
    } = this.props;
    const tableId = table.id;

    const row = f.compose(
      f.find(row => row.id === cell.row.id),
      f.propOr([], `rows.${tableId}.data`)
    )(grudData);
    const { open } = this.state;
    const buttonClass = classNames("popup-button", { "is-open": open });
    const cells = f.get(["row", "cells"], this.props);
    const translationInfo = {
      show: true,
      cell: addCellId((cells && (cells[1] || cells[0])) || {})
    };

    const hasElements = queueName =>
      f.flow(
        f.get(["tableView", "history", queueName]),
        f.filter(f.propEq("tableId", tableId)),
        f.negate(f.isEmpty)
      )(this.props);
    const canUndo = hasElements("undoQueue");
    const canRedo = hasElements("redoQueue");

    return (
      <div className="header-popup-wrapper">
        <button
          className={buttonClass}
          onMouseLeave={this.handleMouseLeave}
          onClick={event => {
            event.stopPropagation();
            this.setState({ open: !open });
            this.cancelClosingTimer();
          }}
        >
          <SvgIcon icon="vdots" containerClasses="color-white" />
        </button>
        {row && open ? (
          <div className="popup-wrapper">
            <div
              className="popup"
              onMouseLeave={this.handleMouseLeave}
              onMouseEnter={this.handleMouseEnter}
            >
              <div className="separator">
                {i18n.t("table:menus.information")}
              </div>
              {hasMeaningfulLinks
                ? this.mkEntry(0, {
                    title: "table:show_dependency",
                    fn: () => openShowDependency({ table, row, langtag, cell }),
                    icon: "code-fork"
                  })
                : null}
              {this.mkEntry(1, {
                title: "table:show_translation",
                fn: () => funcs.setTranslationView(translationInfo),
                icon: "flag"
              })}
              {this.mkEntry(2, {
                title: "table:open-dataset",
                fn: () =>
                  openInNewTab({
                    tableId,
                    row,
                    langtag,
                    filter: true
                  }),
                icon: "external-link"
              })}
              <div className="separator">{i18n.t("table:menus.edit")}</div>
              {isLocked(row)
                ? null
                : this.mkEntry(3, {
                    title: "table:delete_row",
                    fn: () => initiateDeleteRow({ table, row, langtag }, id),
                    icon: "trash"
                  })}
              {canUndo
                ? this.mkEntry(3, {
                    title: "table:undo",
                    fn: () => actions.modifyHistory("undo", tableId),
                    icon: "undo"
                  })
                : null}
              {canRedo
                ? this.mkEntry(3, {
                    title: "table:redo",
                    fn: () => actions.modifyHistory("redo", tableId),
                    icon: "repeat"
                  })
                : null}
              {this.mkEntry(4, {
                title: "table:duplicate_row",
                fn: () =>
                  initiateDuplicateRow({
                    table,
                    tableId,
                    row,
                    langtag,
                    rowId: row.id
                  }),
                icon: "clone"
              })}
              {this.mkEntry(5, {
                title: row.final
                  ? "table:final.set_not_final"
                  : "table:final.set_final",
                fn: () =>
                  setRowAnnotation({
                    table,
                    row,
                    flagName: "final",
                    flagValue: !row.final
                  }),
                icon: "lock"
              })}
            </div>
          </div>
        ) : null}
      </div>
    );
  }
}

export default listenToClickOutside(HeaderPopupMenu);
