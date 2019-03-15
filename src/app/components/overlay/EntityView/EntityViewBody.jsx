import { withPropsOnChange } from "recompose";
import React, { Component } from "react";
import * as f from "lodash/fp";
import i18n from "i18next";

import PropTypes from "prop-types";
import classNames from "classnames";

import {
  ColumnKinds,
  Directions,
  FilterModes
} from "../../../constants/TableauxConstants";
import { addCellId } from "../../../helpers/getCellId";
import { doto, maybe } from "../../../helpers/functools";
import { getLanguageOrCountryIcon } from "../../../helpers/multiLanguage";
import { isLocked, unlockRow } from "../../../helpers/annotationHelper";
import KeyboardShortcutsHelper from "../../../helpers/KeyboardShortcutsHelper";
import TranslationPopup from "../../entityView/TranslationPopup";
import View from "../../entityView/RowView";
import columnFilter from "./columnFilter";

const CLOSE_POPUP_DELAY = 200; // milliseconds
const SHAKE_DURATION = 800;
const ARROW_HEIGHT_IN_PX = 50 / 2;

class EntityViewBody extends Component {
  constructor(props) {
    super(props);
    this.state = {
      langtag: props.langtag,
      filter: {
        value: "",
        mode: FilterModes.CONTAINS
      },
      focused: null,
      itemWithPopup: null
    };
    this.focusElements = {};
    this.translationItem = null;
    this.funcs = [];
    props.registerForEvent({
      type: "scroll",
      handler: () => this.setTranslationItem()
    });
  }

  getKeyboardShortcuts = () => {
    return {
      escape: () => {
        this.setTranslationView({ show: false });
      },
      tab: event => {
        event.preventDefault();
        event.stopPropagation();
        const dir = event.shiftKey ? Directions.UP : Directions.DOWN;
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
      },
      always: event => {
        event.stopPropagation();
      }
    };
  };

  componentWillMount = () => {
    this.props.updateSharedData(
      f.merge(f.__, {
        setFilter: f.debounce(250, this.setColumnFilter),
        setContentLanguage: this.switchLang,
        setTranslationView: this.setTranslationView
      })
    );
  };

  componentDidMount() {
    const { cells, focusElementId } = this.props;
    const cellToFocus = focusElementId
      ? f.find(f.propEq(["column", "id"], focusElementId), cells)
      : null;
    const focusTarget =
      cellToFocus && cellToFocus.kind !== ColumnKinds.concat
        ? cellToFocus.id
        : cells[0];
    this.changeFocus(focusTarget);
  }

  componentWillUnmount = () => {
    this.cancelClosingTimer();
    maybe(this.shakeTimerId).map(window.clearTimeout);
  };

  setColumnFilter = ({ value, filterMode }) => {
    this.setState({
      filter: {
        value,
        mode: filterMode,
        langtag: this.state.langtag
      }
    });
  };

  switchLang = ({ langtag }) => {
    const newLang = getLanguageOrCountryIcon(langtag);
    this.props.actions.showToast({
      content: (
        <div className="language-info-toast">
          <div className="new-lang">{newLang}</div>
        </div>
      ),
      duration: 2000
    });
    this.setState({ langtag });
  };

  setTranslationView = item => {
    const { actions, id } = this.props;
    const oldItem = this.props.translationView || {};
    const newItem = {
      show: f.isNil(item.show) ? f.prop("show", oldItem) : item.show,
      cell: f.isNil(item.cell) ? f.prop("cell", oldItem) : item.cell
    };
    actions.setOverlayState({ id, translationView: newItem });
  };

  registerFocusable = id => el => {
    this.focusElements = f.assoc(id, el, this.focusElements);
  };

  getVisibleCells = () => {
    const { cells } = this.props;
    const { filter, langtag } = this.state;
    return cells
      .filter(this.groupFilter(this.props.filterColumn))
      .filter(columnFilter(langtag, filter));
  };

  changeFocus = dir => {
    const numericDir = dir === Directions.UP ? -1 : +1;
    const { focused } = this.state;
    const visibleCells = this.getVisibleCells();
    const selectedIdx = f.findIndex(
      f.matchesProperty("id", focused),
      visibleCells
    );
    const { focusElements } = this;
    const toFocus = f.cond([
      [
        d => f.contains(d, [Directions.UP, Directions.DOWN]),
        () => f.prop([selectedIdx + numericDir, "id"], visibleCells)
      ],
      [f.stubTrue, f.identity]
    ])(dir);

    maybe(focusElements[toFocus])
      .method("focus")
      .map(() => this.setState({ focused: toFocus }));
  };

  renderTranslationView = () => {
    const { arrowPosition } = this.state;
    const { langtag, translationView = {} } = this.props;
    const arrow =
      f.isNumber(arrowPosition) && f.prop("show", translationView) ? (
        <div
          className="translation-arrow"
          style={{ transform: `translateY(${arrowPosition}px)` }}
        />
      ) : null;
    return translationView.show ? (
      <div>
        <TranslationPopup
          cell={translationView.cell || {}}
          langtag={langtag}
          setTranslationView={this.setTranslationView}
        />
        {arrow}
      </div>
    ) : null;
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
    this.setState({ arrowPosition: pos >= 120 ? pos : null });
  };

  openItemPopup = idx => () => {
    this.cancelClosingTimer();
    this.setState({ itemWithPopup: idx });
  };
  closeItemPopup = idx => () => {
    this.cancelClosingTimer();
    if (this.state.itemWithPopup !== idx) {
      return;
    }
    this.setState({ itemWithPopup: null });
  };

  startClosingTimer = () => {
    this.cancelClosingTimer();
    this.timerId = window.setTimeout(
      this.closeItemPopup(this.state.itemWithPopup),
      CLOSE_POPUP_DELAY
    );
  };
  cancelClosingTimer = () => {
    maybe(this.timerId).map(id => {
      window.clearTimeout(id);
      this.timerId = null;
    });
  };

  // Opening/closing popup by click will modify the DOM, so the
  // hovering pointer will cause mouseEnter + mouseLeave events. To
  // ignore them, check if any button is pressed when handling the
  // enter/leave events.
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
    this.setState({ shaking: true });
    this.shakeTimerId = window.setTimeout(
      () => this.setState({ shaking: false }),
      SHAKE_DURATION
    );
  };

  unlockRowTemporary = () => {
    unlockRow(this.props.row, true);
    this.forceUpdate();
  };

  renderUnlockBar = () => {
    const { row } = this.props;
    if (!isLocked(row)) {
      return null;
    }
    const buttonClass = classNames("button", { shake: this.state.shaking });
    return (
      <div className="unlock-bar">
        <div className="text">
          <i className="fa fa-lock" />
          <span>{i18n.t("table:row-is-locked")}</span>
        </div>
        <div className={buttonClass} onClick={this.unlockRowTemporary}>
          <a href="#">{i18n.t("table:unlock-row")}</a>
        </div>
      </div>
    );
  };

  // (filterColumn) -> (cell) -> boolean
  groupFilter = filterColumn => {
    const prefilteredIds = filterColumn
      ? f.map("id", filterColumn.concats || filterColumn.groups)
      : null;

    return cell => {
      return filterColumn
        ? f.contains(f.get(["column", "id"], cell), prefilteredIds)
        : !cell.column.isGroupMember;
    };
  };

  componentWillUpdate(nextProps) {
    if (this.props.row.id !== nextProps.row.id) {
      this.funcs = [];
    }
  }

  render() {
    const { row, actions, cells } = this.props;
    const { filter, focused } = this.state;
    const { filterColumn, grudData } = this.props;
    const {
      enterItemPopupButton,
      leaveItemPopupButton,
      openItemPopup,
      closeItemPopup
    } = this;
    const evbClass = classNames(`entity-view content-items ${this.props.id}`, {
      "is-locked": isLocked(row)
    });
    return (
      <div
        className={evbClass}
        onKeyDown={KeyboardShortcutsHelper.onKeyboardShortcut(
          this.getKeyboardShortcuts
        )}
      >
        {cells
          .filter(cell => cell.kind !== ColumnKinds.concat)
          .filter(this.groupFilter(filterColumn))
          .filter(columnFilter(filter.langtag || this.props.langtag, filter))
          .map((cell, idx) => {
            return (
              <View
                key={cell.id}
                cell={cell}
                langtag={this.state.langtag}
                uiLangtag={this.props.langtag}
                setTranslationView={this.setTranslationView}
                hasFocusedChild={f.eq(cell.id, focused)}
                hasMeaningfulLinks={!filterColumn}
                popupOpen={this.state.itemWithPopup === idx}
                funcs={
                  this.funcs[idx] ||
                  (this.funcs[idx] = {
                    setTranslationItem: this.setTranslationItem,
                    register: this.registerFocusable(cell.id),
                    focus: this.changeFocus,
                    id: cell.id,
                    enterItemPopupButton: enterItemPopupButton(idx),
                    leaveItemPopupButton: leaveItemPopupButton(idx),
                    openItemPopup: openItemPopup(idx),
                    closeItemPopup: closeItemPopup(idx),
                    hintUnlockButton: this.shakeBar
                  })
                }
                lockStatus={isLocked(row)}
                final={row.final}
                value={JSON.stringify(cell.value)}
                annotations={JSON.stringify(cell.annotations)}
                actions={actions}
                grudData={grudData}
              />
            );
          })}
        {this.renderUnlockBar()}
        {this.renderTranslationView()}
      </div>
    );
  }
}

// Re-construct relevant data from previous Ampersand cell model so
// downstream functions and components need no changes
export default withPropsOnChange(["grudData"], ({ grudData, table, row }) => {
  const findDisplayValue = f.memoize(tableId => {
    const tableDv = f.prop(["displayValues", tableId], grudData);
    return f.memoize(rowId => {
      const rowDv = f.find(f.propEq("id", rowId), tableDv);
      return columnIdx => {
        const dv = f.prop(["values", columnIdx], rowDv);
        return dv;
      };
    });
  });

  const getDisplayValue = (column, columnIdx, value) =>
    column.kind === "link"
      ? f.map(
          linkedRow => findDisplayValue(column.toTable)(linkedRow.id)(0),
          value
        )
      : findDisplayValue(table.id)(row.id)(columnIdx);

  const rowData = doto(
    grudData,
    f.prop(["rows", table.id, "data"]),
    f.find(f.propEq("id", row.id))
  );
  const cells = f
    .zip(rowData.cells, rowData.values)
    .map(([cell, cellValue], idx) => {
      return addCellId({
        ...cell,
        value: cellValue,
        displayValue: getDisplayValue(cell.column, idx, cellValue)
      });
    });
  return { cells };
})(EntityViewBody);

EntityViewBody.propTypes = {
  langtag: PropTypes.string.isRequired,
  row: PropTypes.object.isRequired,
  registerForEvent: PropTypes.func.isRequired,
  filterColumn: PropTypes.object
};
