import React, { Component } from "react";
import PropTypes from "prop-types";
import i18n from "i18next";
import classNames from "classnames";
import * as f from "lodash/fp";
import { openShowDependency } from "../ConfirmDependentOverlay";
import {
  initiateDeleteRow,
  initiateDuplicateRow
} from "../../../helpers/rowHelper";
import { isLocked, setRowAnnotation } from "../../../helpers/annotationHelper";
import listenToClickOutside from "react-onclickoutside";
import SvgIcon from "../../helperComponents/SvgIcon";
import { openInNewTab } from "../../../helpers/apiUrl";
import { isFinal } from "../../../helpers/annotationHelper";
import { addCellId } from "../../../helpers/getCellId";
import * as TableHistory from "../../table/undo/tableHistory";

const CLOSING_TIMEOUT = 300; // ms; time to close popup after mouse left

@listenToClickOutside
class HeaderPopupMenu extends Component {
  static propTypes = {
    langtag: PropTypes.string.isRequired,
    row: PropTypes.object.isRequired,
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
      <a className="entry" onClick={clickHandler} href="#">
        <i className={`fa fa-${icon}`} />
        <div>{i18n.t(title)}</div>
      </a>
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

  handleUndo = () => TableHistory.undo(this.getHistoryView());
  handleRedo = () => TableHistory.redo(this.getHistoryView());

  render() {
    const { funcs, cell, langtag, hasMeaningfulLinks, row, id } = this.props;
    const { open } = this.state;
    const buttonClass = classNames("popup-button", { "is-open": open });
    const translationInfo = {
      show: true,
      cell: addCellId(cell)
    };
    const historyView = this.getHistoryView();

    return (
      <div className="header-popup-wrapper">
        <div className={buttonClass} onMouseLeave={this.handleMouseLeave}>
          <a
            href="#"
            onClick={event => {
              event.stopPropagation();
              this.setState({ open: !open });
              this.cancelClosingTimer();
            }}
          >
            <SvgIcon icon="vdots" containerClasses="color-white" />
          </a>
        </div>
        {open ? (
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
                    fn: () => openShowDependency(row, langtag),
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
                    tableId: row.tableId,
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
                    fn: () => initiateDeleteRow(row, langtag, id),
                    icon: "trash"
                  })}
              {TableHistory.canUndo(historyView)
                ? this.mkEntry(3, {
                    title: "table:undo",
                    fn: this.handleUndo,
                    icon: "undo"
                  })
                : null}
              {TableHistory.canRedo(historyView)
                ? this.mkEntry(3, {
                    title: "table:redo",
                    fn: this.handleRedo,
                    icon: "repeat"
                  })
                : null}
              {this.mkEntry(4, {
                title: "table:duplicate_row",
                fn: () => initiateDuplicateRow(row, langtag),
                icon: "clone"
              })}
              {this.mkEntry(5, {
                title: row.final
                  ? "table:final.set_not_final"
                  : "table:final.set_final",
                fn: () => setRowAnnotation({ final: isFinal(row) }, row),
                icon: "lock"
              })}
            </div>
          </div>
        ) : null}
      </div>
    );
  }
}

export default HeaderPopupMenu;
