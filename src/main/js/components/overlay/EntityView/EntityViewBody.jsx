import React, {Component, PropTypes} from "react";
import View from "../../entityView/RowView";
import {ActionTypes, ColumnKinds, Directions, FilterModes} from "../../../constants/TableauxConstants";
import Dispatcher from "../../../dispatcher/Dispatcher";
import listensToClickOutside from "react-onclickoutside";
import zenscroll from "zenscroll";
import {maybe} from "../../../helpers/monads";
import TranslationPopup from "../../entityView/TranslationPopup";
import * as f from "lodash/fp";
import columnFilter from "./columnFilter";
import KeyboardShortcutsHelper from "../../../helpers/KeyboardShortcutsHelper";
import classNames from "classnames";
import {isLocked} from "../../../helpers/annotationHelper";

const CLOSE_POPUP_DELAY = 200; // milliseconds

@listensToClickOutside
class EntityViewBody extends Component {
  constructor(props) {
    super(props);
    this.state = {
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
    overlayId: PropTypes.number.isRequired,
    registerForEvent: PropTypes.func.isRequired
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
    }
  };

  handleClickOutside() {
    this.setTranslationView({show: false});
  }

  componentWillMount = () => {
    Dispatcher.on(ActionTypes.SWITCH_ENTITY_VIEW_LANGUAGE, this.switchLang);
    Dispatcher.on(ActionTypes.SET_TRANSLATION_VIEW, this.setTranslationView);
    Dispatcher.on(ActionTypes.FILTER_ENTITY_VIEW, this.setColumnFilter);
  };

  componentDidMount() {
    const {focusElementId, row} = this.props;
    if (focusElementId) {
      const cell = row.cells.get(focusElementId);
      if (cell.kind === ColumnKinds.concat) {
        return; // concat elements are omitted from EntityView and are first anyway
      }
      const viewId = `view-${cell.column.id}-${cell.rowId}`;
      const element = f.first(document.getElementsByClassName(viewId));
      const scroller = this.getScroller()
                           .center(element, 1);
      this.setState({focused: focusElementId});
    } else {
      const firstCell = row.cells.at(0);
      this.changeFocus(firstCell.id);
    }
  }

  componentWillUnmount = () => {
    Dispatcher.off(ActionTypes.SWITCH_ENTITY_VIEW_LANGUAGE, this.switchLang);
    Dispatcher.off(ActionTypes.SET_TRANSLATION_VIEW, this.setTranslationView);
    Dispatcher.off(ActionTypes.FILTER_ENTITY_VIEW, this.setColumnFilter);
    this.cancelClosingTimer();
  };

  setColumnFilter = ({id, value, filterMode}) => {
    if (id !== this.props.overlayId) {
      return;
    }

    this.setState({
      filter: {
        value,
        mode: filterMode
      }
    });
  };

  switchLang = ({langtag}) => {
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

  getScroller = () => {
    const {id} = this.props;
    const container = f.first(document.getElementsByClassName(id.toString())).parentElement;
    return zenscroll.createScroller(container);
  };

  registerFocusable = id => el => {
    this.focusElements = f.assoc(id, el, this.focusElements);
  };

  changeFocus = dir => {
    const numericDir = (dir === Directions.UP) ? -1 : +1;
    const {focused} = this.state;
    const {langtag, filter} = this.state;
    const visibleCells = this.props.row.cells.models.filter(columnFilter(langtag, filter));
    const selectedIdx = f.findIndex(f.matchesProperty("id", focused), visibleCells);
    const {focusElements} = this;
    const toFocus = f.cond([
      [
        d => f.contains(d, [Directions.UP, Directions.DOWN]),
        d => f.prop([selectedIdx + numericDir, "id"], visibleCells)
      ],
      [
        f.stubTrue,
        f.identity
      ]
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
      : null
  };

  setTranslationItem = el => {
    if (el && el !== this.translationItem) {
      this.translationItem = el;
    }
    const arrowPos = maybe(this.translationItem)
      .exec("getBoundingClientRect")
      .map(f.prop("top"))
      .map(pos => {
        this.setState({arrowPosition: (pos >= 120) ? pos : null});
      });
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

  enterItemPopupButton = idx => () => {
    this.cancelClosingTimer();
    if (this.state.itemWithPopup !== idx) {
      this.openItemPopup(idx)();
    }
  };
  leaveItemPopupButton = idx => () => {
    if (this.state.itemWithPopup === idx) {
      this.startClosingTimer();
    }
  };

  render() {
    const cells = this.props.row.cells.models;
    const {langtag, filter, focused} = this.state;
    const {enterItemPopupButton, leaveItemPopupButton, openItemPopup, closeItemPopup} = this;
    const evbClass = classNames(`entity-view content-items ${this.props.id}`, {
      "is-locked": isLocked(this.props.row)
    });

    return (
      <div className={evbClass}
           onKeyDown={KeyboardShortcutsHelper.onKeyboardShortcut(this.getKeyboardShortcuts)}
      >
        {cells
          .filter(cell => cell.kind !== ColumnKinds.concat)
          .filter(columnFilter(langtag, filter))
          .map(
            (cell, idx) => {
              return <View key={idx} cell={cell} langtag={langtag}
                           setTranslationView={this.setTranslationView}
                           hasFocusedChild={f.eq(cell.id, focused)}
                           popupOpen={this.state.itemWithPopup === idx}
                           funcs={{
                             setTranslationItem: this.setTranslationItem,
                             register: this.registerFocusable(cell.id),
                             focus: this.changeFocus,
                             id: cell.id,
                             enterItemPopupButton: enterItemPopupButton(idx),
                             leaveItemPopupButton: leaveItemPopupButton(idx),
                             openItemPopup: openItemPopup(idx),
                             closeItemPopup: closeItemPopup(idx)
                           }}
              />;
            })
        }
        {this.renderTranslationView()}
      </div>
    );
  }
}

export default EntityViewBody;