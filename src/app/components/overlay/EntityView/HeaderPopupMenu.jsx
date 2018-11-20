import React, {Component} from "react";
import PropTypes from "prop-types";
// import ActionCreator from "../../../actions/ActionCreator";
import i18n from "i18next";
import classNames from "classnames";
import * as f from "lodash/fp";
import {openShowDependency} from "../ConfirmDependentOverlay";
import {maybe} from "../../../helpers/functools";
import {initiateDeleteRow, initiateDuplicateRow} from "../../../helpers/rowHelper";
import {isLocked, setRowAnnotation} from "../../../helpers/annotationHelper";
import listenToClickOutside from "react-onclickoutside";
import SvgIcon from "../../helperComponents/SvgIcon";
// import Dispatcher from "../../../dispatcher/Dispatcher";
import {ActionTypes} from "../../../constants/TableauxConstants";
import {openInNewTab} from "../../../helpers/apiUrl";
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
      open: false,
      row: props.row
    };
  }

  componentDidMount() {
    // Dispatcher.on(ActionTypes.CHANGE_ENTITY_VIEW_ROW, this.changeRow);
  }

  componentWillUnmount() {
    // Dispatcher.off(ActionTypes.CHANGE_ENTITY_VIEW_ROW, this.changeRow);
    this.cancelClosingTimer();
  }

  changeRow = ({row, id}) => {
    if (this.props.id === id) {
      this.setState({row});
    }
  };

  mkEntry = (id, {title, fn, icon}) => {
    const clickHandler = f.flow(
      fn,
      () => this.setState({open: false})
    );
    return (
      <a className="entry"
        onClick={clickHandler}
        href="#"
      >
        <i className={`fa fa-${icon}`} />
        <div>{i18n.t(title)}</div>
      </a>
    );
  };

  handleClickOutside = () => {
    this.cancelClosingTimer();
    this.setState({open: false});
  };

  startClosingTimer = () => {
    this.cancelClosingTimer();
    this.timeoutId = window.setTimeout(() => this.setState({open: false}), CLOSING_TIMEOUT);
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
      this.setState({open: true});
    }
  };

  getHistoryView = () => {
    const {row} = this.props;
    const {tableId} = row.cells.at(0);
    return {
      tableId,
      rowId: row.id
    };
  };

  handleUndo = () => TableHistory.undo(this.getHistoryView());
  handleRedo = () => TableHistory.redo(this.getHistoryView());

  render() {
    const {langtag, hasMeaningfulLinks, id} = this.props;
    const {open, row} = this.state;
    const buttonClass = classNames("popup-button", {"is-open": open});
    const translationInfo = {
      show: true,
      cell: maybe(row.cells).exec("at", 0).getOrElse(null)
    };
    const historyView = this.getHistoryView();

    return (
      <div className="header-popup-wrapper">
        <div className={buttonClass}
          onMouseLeave={this.handleMouseLeave}
        >
          <a href="#" onClick={event => {
            event.stopPropagation();
            this.setState({open: !open});
            this.cancelClosingTimer();
          }}>
            <SvgIcon icon="vdots" containerClasses="color-white" />
          </a>
        </div>
        {(open)
          ? (
            <div className="popup-wrapper">
              <div className="popup"
                onMouseLeave={this.handleMouseLeave}
                onMouseEnter={this.handleMouseEnter}
              >
                <div className="separator">{i18n.t("table:menus.information")}</div>
                {(hasMeaningfulLinks)
                  ? this.mkEntry(0,
                    {
                      title: "table:show_dependency",
                      fn: () => openShowDependency(row, langtag),
                      icon: "code-fork"
                    })
                  : null
                }
                {this.mkEntry(1,
                  {
                    title: "table:show_translation",
                    // fn: () => ActionCreator.setTranslationView(translationInfo),
                    icon: "flag"
                  })}
                {this.mkEntry(2,
                  {
                    title: "table:open-dataset",
                    fn: () => openInNewTab({
                      tableId: row.tableId,
                      row,
                      langtag,
                      filter: true
                    }),
                    icon: "external-link"
                  })}
                <div className="separator">{i18n.t("table:menus.edit")}</div>
                {(isLocked(row))
                  ? null
                  : this.mkEntry(3,
                    {
                      title: "table:delete_row",
                      fn: () => initiateDeleteRow(row, langtag, id),
                      icon: "trash"
                    })
                }
                {(TableHistory.canUndo(historyView))
                  ? this.mkEntry(3,
                    {
                      title: "table:undo",
                      fn: this.handleUndo,
                      icon: "undo"
                    })
                  : null
                }
                {(TableHistory.canRedo(historyView))
                  ? this.mkEntry(3,
                    {
                      title: "table:redo",
                      fn: this.handleRedo,
                      icon: "repeat"
                    })
                  : null
                }
                {this.mkEntry(4,
                  {
                    title: "table:duplicate_row",
                    fn: () => initiateDuplicateRow(row, langtag),
                    icon: "clone"
                  })}
                {this.mkEntry(5,
                  {
                    title: (row.final) ? "table:final.set_not_final" : "table:final.set_final",
                    fn: () => setRowAnnotation({final: !row.final}, row),
                    icon: "lock"
                  })}
              </div>
            </div>
          )
          : null
        }
      </div>
    );
  }
}

export default HeaderPopupMenu;
