import React, {Component, PropTypes} from "react";
import View from "../../entityView/RowView";
import {ActionTypes, ColumnKinds, Directions, FilterModes} from "../../../constants/TableauxConstants";
import Dispatcher from "../../../dispatcher/Dispatcher";
import {maybe} from "../../../helpers/functools";
import TranslationPopup from "../../entityView/TranslationPopup";
import * as f from "lodash/fp";
import columnFilter from "./columnFilter";
import KeyboardShortcutsHelper from "../../../helpers/KeyboardShortcutsHelper";
import classNames from "classnames";
import {isLocked, unlockRow} from "../../../helpers/annotationHelper";
import i18n from "i18next";
import connectToAmpersand from "../../helperComponents/connectToAmpersand";
import {showToast} from "../../../actions/ActionCreator";
import {getLanguageOrCountryIcon} from "../../../helpers/multiLanguage";

const CLOSE_POPUP_DELAY = 200; // milliseconds
const SHAKE_DURATION = 800;
const ARROW_HEIGHT_IN_PX = 50 / 2;

@connectToAmpersand
class EntityViewBody extends Component {
  constructor(props) {
    super(props);
    this.state = {
      row: props.row,
      langtag: props.langtag,
      translationView: false,
      filter: {
        value: "",
        mode: FilterModes.CONTAINS
      },
      focused: null,
      itemWithPopup: null
    };
    this.focusElements = {};
    this.translationItem = null;
    props.registerForEvent({
      type: "scroll",
      handler: () => this.setTranslationItem()
    });
  }

  static PropTypes = {
    langtag: PropTypes.string.isRequired,
    row: PropTypes.object.isRequired,
    registerForEvent: PropTypes.func.isRequired,
    filterColumn: PropTypes.object
  };

  getKeyboardShortcuts = () => {
    return {
      escape: event => {
        this.setTranslationView({show: false});
      },
      tab: event => {
        event.preventDefault();
        event.stopPropagation();
        const dir = (event.shiftKey) ? Directions.UP : Directions.DOWN;
        this.changeFocus(dir);
      },
      up: event => {
        event.preventDefault();
        event.stopPropagation();
        this.changeFocus(Directions.UP);
      },
      down: event => {
        event.preventDefault();
        event.stopPropagation();
        this.changeFocus(Directions.DOWN);
      }
    };
  };

  componentWillMount = () => {
    Dispatcher.on(ActionTypes.SWITCH_ENTITY_VIEW_LANGUAGE, this.switchLang);
    Dispatcher.on(ActionTypes.SET_TRANSLATION_VIEW, this.setTranslationView);
    Dispatcher.on(ActionTypes.FILTER_ENTITY_VIEW, this.setColumnFilter);
    Dispatcher.on(ActionTypes.CHANGE_ENTITY_VIEW_ROW, this.changeRow);
  };

  componentDidMount() {
    const {focusElementId} = this.props;
    const {row} = this.state;
    const cellToFocus = (focusElementId)
      ? row.cells.get(focusElementId)
      : null;
    const focusTarget = (cellToFocus && cellToFocus.kind !== ColumnKinds.concat)
      ? cellToFocus.id
      : row.cells.at(0);
    this.changeFocus(focusTarget);
  }

  componentWillUnmount = () => {
    Dispatcher.off(ActionTypes.SWITCH_ENTITY_VIEW_LANGUAGE, this.switchLang);
    Dispatcher.off(ActionTypes.SET_TRANSLATION_VIEW, this.setTranslationView);
    Dispatcher.off(ActionTypes.FILTER_ENTITY_VIEW, this.setColumnFilter);
    Dispatcher.off(ActionTypes.CHANGE_ENTITY_VIEW_ROW, this.changeRow);
    this.cancelClosingTimer();
    maybe(this.shakeTimerId).map(window.clearTimeout);
  };

  changeRow = ({id, row}) => {
    if (this.props.id !== id) {
      return;
    }

    const selectedIndex = f.findIndex(f.matchesProperty("id", this.state.focused), this.getVisibleCells());

    const restoreFocus = () => {
      if (selectedIndex < 0) {
        return;
      }
      // visibleCells changed meanwhile
      this.changeFocus(f.get([selectedIndex, "id"], this.getVisibleCells()));
    };

    this.setState({
      row,
      focused: null,
      itemWithPopup: null
    }, restoreFocus);
    this.props.watch(row);
    this.translationItem = null;
    this.cancelClosingTimer();
  };

  setColumnFilter = ({id, value, filterMode}) => {
    if (id !== this.props.id) {
      return;
    }

    this.setState({
      filter: {
        value,
        mode: filterMode,
        langtag: this.state.langtag
      }
    });
  };

  switchLang = ({langtag}) => {
    const newLang = getLanguageOrCountryIcon(langtag);
    showToast(<div className="language-info-toast">
      <div className="new-lang">{newLang}</div>
    </div>,
    2000);
    this.setState({langtag});
  };

  setTranslationView = item => {
    const oldItem = this.state.translationView;
    const newItem = {
      show: (f.isNil(item.show) ? f.prop("show", oldItem) : item.show),
      cell: (f.isNil(item.cell) ? f.prop("cell", oldItem) : item.cell)
    };
    this.setState({translationView: newItem});
  };

  registerFocusable = id => el => {
    this.focusElements = f.assoc(id, el, this.focusElements);
  };

  getVisibleCells = () => {
    const {filter, langtag, row} = this.state;
    return row.cells.models
              .filter(this.groupFilter(this.props.filterColumn))
              .filter(columnFilter(langtag, filter));
  };

  changeFocus = dir => {
    const numericDir = (dir === Directions.UP) ? -1 : +1;
    const {focused} = this.state;
    const visibleCells = this.getVisibleCells();
    const selectedIdx = f.findIndex(f.matchesProperty("id", focused), visibleCells);
    const {focusElements} = this;
    const toFocus = f.cond([
      [d => f.contains(d, [Directions.UP, Directions.DOWN]), d => f.prop([selectedIdx + numericDir, "id"], visibleCells)],
      [f.stubTrue, f.identity]
    ])(dir);

    maybe(focusElements[toFocus])
      .method("focus")
      .map(() => this.setState({focused: toFocus}));
  };

  renderTranslationView = () => {
    const {translationView, langtag, arrowPosition} = this.state;
    const arrow = (f.isNumber(arrowPosition) && f.prop("show", translationView))
      ? <div className="translation-arrow" style={{transform: `translateY(${arrowPosition}px)`}} />
      : null;
    return (translationView.show)
      ? (
        <div>
          <TranslationPopup cell={translationView.cell || {}}
                            langtag={langtag}
                            setTranslationView={this.setTranslationView}
          />
          {arrow}
        </div>
      )
      : null;
  };

  setTranslationItem = el => {
    if (el && el !== this.translationItem) {
      this.translationItem = el;
    }
    const br = maybe(this.translationItem)
      .exec("getBoundingClientRect")
      .getOrElse(null);
    if (!br) {
      return;
    }

    const pos = br.top + 0.5 * br.height - ARROW_HEIGHT_IN_PX;
    this.setState({arrowPosition: (pos >= 120) ? pos : null});
  };

  openItemPopup = idx => () => {
    this.cancelClosingTimer();
    this.setState({itemWithPopup: idx});
  };
  closeItemPopup = idx => () => {
    this.cancelClosingTimer();
    if (this.state.itemWithPopup !== idx) {
      return;
    }
    this.setState({itemWithPopup: null});
  };

  startClosingTimer = () => {
    this.cancelClosingTimer();
    this.timerId = window.setTimeout(this.closeItemPopup(this.state.itemWithPopup), CLOSE_POPUP_DELAY);
  };
  cancelClosingTimer = () => {
    maybe(this.timerId)
      .map(id => {
        window.clearTimeout(id);
        this.timerId = null;
      });
  };

  // Opening/closing popup by click will modify the DOM, so the hovering pointer will cause mouseEnter + mouseLeave
  // events. To ignore them, check if any button is pressed when handling the enter/leave events.
  enterItemPopupButton = idx => event => {
    if (event.buttons > 0) {
      return;
    }
    this.cancelClosingTimer();
    if (this.state.itemWithPopup !== idx) {
      this.openItemPopup(idx)();
    }
  };
  leaveItemPopupButton = idx => event => {
    if (event.buttons > 0) {
      return;
    }
    if (this.state.itemWithPopup === idx) {
      this.startClosingTimer();
    }
  };

  shakeBar = () => {
    this.setState({shaking: true});
    this.shakeTimerId = window.setTimeout(() => this.setState({shaking: false}), SHAKE_DURATION);
  };

  unlockRowTemporary = () => {
    unlockRow(this.state.row, true);
    this.setState({row: this.state.row}); //
  };

  renderUnlockBar = () => {
    const {row} = this.state;
    if (!isLocked(row)) {
      return null;
    }
    const buttonClass = classNames("button", {"shake": this.state.shaking});
    return (
      <div className="unlock-bar">
        <div className="text">
          <i className="fa fa-lock" />
          <span>{i18n.t("table:row-is-locked")}</span>
        </div>
        <div className={buttonClass} onClick={this.unlockRowTemporary}>
          <a href="#">
            {i18n.t("table:unlock-row")}
          </a>
        </div>
      </div>
    );
  };

  groupFilter = (filterColumn) => (cell) => {
    const prefilteredIds = (filterColumn) ? f.map(f.get("id"), filterColumn.concats || filterColumn.groups) : null;
    return (filterColumn)
      ? f.contains(f.get(["column", "id"], cell), prefilteredIds)
      : !cell.column.isGroupMember;
  };

  render() {
    const cells = this.state.row.cells.models;
    const {langtag, filter, focused} = this.state;
    const {filterColumn} = this.props;
    const {enterItemPopupButton, leaveItemPopupButton, openItemPopup, closeItemPopup} = this;
    const evbClass = classNames(`entity-view content-items ${this.props.id}`, {
      "is-locked": isLocked(this.state.row)
    });

    return (
      <div className={evbClass}
           onKeyDown={KeyboardShortcutsHelper.onKeyboardShortcut(this.getKeyboardShortcuts)}
      >
        {cells
          .filter(cell => cell.kind !== ColumnKinds.concat)
          .filter(this.groupFilter(filterColumn))
          .filter(columnFilter(filter.langtag, filter))
          .map(
            (cell, idx) => {
              return <View key={cell.id} cell={cell} langtag={langtag}
                           setTranslationView={this.setTranslationView}
                           hasFocusedChild={f.eq(cell.id, focused)}
                           hasMeaningfulLinks={!filterColumn}
                           popupOpen={this.state.itemWithPopup === idx}
                           funcs={{
                             setTranslationItem: this.setTranslationItem,
                             register: this.registerFocusable(cell.id),
                             focus: this.changeFocus,
                             id: cell.id,
                             enterItemPopupButton: enterItemPopupButton(idx),
                             leaveItemPopupButton: leaveItemPopupButton(idx),
                             openItemPopup: openItemPopup(idx),
                             closeItemPopup: closeItemPopup(idx),
                             hintUnlockButton: this.shakeBar
                           }}
                           lockStatus={cell.row.unlocked}
                           final={cell.row.final}
                           value={JSON.stringify(cell.value)}
                           annotations={JSON.stringify(cell.annotations)}
              />;
            })
        }
        {this.renderUnlockBar()}
        {this.renderTranslationView()}
      </div>
    );
  }
}

export default EntityViewBody;
