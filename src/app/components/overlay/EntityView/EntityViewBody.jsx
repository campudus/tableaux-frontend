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
import { doto, ifElse, maybe, merge } from "../../../helpers/functools";
import { getLanguageOrCountryIcon } from "../../../helpers/multiLanguage";
import { isLocked, unlockRow } from "../../../helpers/annotationHelper";
import KeyboardShortcutsHelper from "../../../helpers/KeyboardShortcutsHelper";
import TranslationPopup from "../../entityView/TranslationPopup";

import View from "../../entityView/RowView";
import columnFilter from "./columnFilter";
import getDisplayValue from "../../../helpers/getDisplayValue";
import { isRowArchived } from "../../../archivedRows/helpers";

const CLOSE_POPUP_DELAY = 200; // milliseconds
const SHAKE_DURATION = 800;
const ARROW_HEIGHT_IN_PX = 50 / 2;

class EntityViewBody extends Component {
  constructor(props) {
    super(props);

    props.updateSharedData(obj =>
      merge(obj, {
        setFilter: f.debounce(250, this.setColumnFilter),
        setContentLanguage: this.switchLang,
        contentLanguage: this.props.langtag,
        setTranslationView: this.setTranslationView
      })
    );

    this.state = {
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

  componentDidMount() {
    const { cells, focusElementId } = this.props;
    const cellToFocus = focusElementId
      ? f.find(f.propEq(["column", "id"], focusElementId), cells)
      : null;
    const focusTarget =
      cellToFocus && cellToFocus.kind !== ColumnKinds.concat
        ? cellToFocus.id
        : cells[0].id;
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
        langtag: this.getContentLanguage()
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
    this.props.updateSharedData(f.assoc("contentLanguage", langtag));
  };

  setTranslationView = item => {
    const { actions, id } = this.props;
    const oldItem = this.props.translationView || {};
    const show = f.isNil(item.show) ? f.prop("show", oldItem) : item.show;

    const func = f.find(funcItem => {
      if (f.get(["cell", "id"], item) === funcItem.id) {
        return true;
      }
      return false;
    }, this.funcs);
    func && func.focus();
    const newItem = {
      show: show,
      cell: func ? func.cell : oldItem.cell
    };
    this.setTranslationItem(this.focusElements[newItem.cell.id]);
    actions.setOverlayState({ id, translationView: newItem });
  };

  registerFocusable = id => el => {
    this.focusElements = f.assoc(id, el, this.focusElements);
  };

  getContentLanguage = () =>
    this.props.sharedData.contentLanguage || this.props.langtag;

  getVisibleCells = () => {
    const { cells } = this.props;
    const { filter } = this.state;
    return cells
      .filter(this.groupFilter(this.props.filterColumn))
      .filter(columnFilter(this.getContentLanguage(), filter));
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
    const { translationView = {}, cells } = this.props;
    const langtag = this.getContentLanguage();
    const arrow =
      f.isNumber(arrowPosition) && f.prop("show", translationView) ? (
        <div
          className="translation-arrow"
          style={{ transform: `translateY(${arrowPosition}px)` }}
        />
      ) : null;
    const handleLanguageSwitch = nextLangtag => {
      if (nextLangtag !== langtag) {
        this.props.sharedData.setContentLanguage({ langtag: nextLangtag });
      }
    };
    const cell =
      (translationView.cell &&
        translationView.cell.id &&
        f.find(f.propEq("id", translationView.cell.id), cells)) ||
      {};
    return translationView.show ? (
      <div>
        <TranslationPopup
          cell={cell}
          langtag={langtag}
          setTranslationView={this.setTranslationView}
          switchLanguage={handleLanguageSwitch}
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

  renderUnlockBar = row => {
    const buttonClass = classNames("button", { shake: this.state.shaking });
    const rowIsArchived = isRowArchived(row);
    const rowIsLocked = isLocked(row);
    const unlock = this.unlockRowTemporary;
    const barTitle = rowIsArchived
      ? "table:archived.is-archived"
      : "table:row-is-locked";
    const buttonAction = "table:unlock-row";

    return (
      (rowIsArchived || rowIsLocked) && (
        <div className="unlock-bar">
          <div className="text">
            <i className="fa fa-lock" />
            <span>{i18n.t(barTitle)}</span>
          </div>
          {!rowIsArchived && rowIsLocked && (
            <button className={buttonClass} onClick={unlock}>
              {i18n.t(buttonAction)}
            </button>
          )}
        </div>
      )
    );
  };

  // (filterColumn?: groupColumn, cells: cell[]) -> (cell) -> boolean
  /**
   * Create a filter to filter cells by group membership status.
   * If filterColumn is a group column, the filter lets only this group's members pass (=> use EntityView as group editor)
   * else let all cells pass which are not members of any groups, editing groups opens a group editor
   */
  groupFilter = (filterColumn, allCells) => {
    // Columns that are members of any group
    const groupColumnIds = doto(
      allCells,
      f.map("column"),
      f.filter(f.prop("groups")),
      f.map(f.flow(f.prop("groups"), f.map("id"))),
      f.flatten
    );

    // Columns that are members of `filterColumn`'s group'
    const prefilteredIds = filterColumn
      ? f.map("id", filterColumn.concats || filterColumn.groups)
      : null;

    return f.flow(
      f.prop(["column", "id"]),
      ifElse(
        () => f.isNil(filterColumn),
        id => !f.contains(id, groupColumnIds), // not filtering for a group, hide members of any groups
        f.contains(f.__, prefilteredIds) // group edit - only show group's members
      )
    );
  };

  componentWillUpdate(nextProps) {
    if (this.props.row.id !== nextProps.row.id) {
      this.funcs = [];
    }
  }

  render() {
    const { row, actions, cells } = this.props;
    const { filter, focused, itemWithPopup } = this.state;
    const langtag = this.getContentLanguage();
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
          .filter(this.groupFilter(filterColumn, cells))
          .filter(
            columnFilter(filter.langtag || this.getContentLanguage(), filter)
          )
          .map((cell, idx) => {
            return (
              <View
                key={cell.id}
                cell={cell}
                langtag={langtag}
                uiLangtag={langtag}
                setTranslationView={this.setTranslationView}
                hasFocusedChild={f.eq(cell.id, focused)}
                hasMeaningfulLinks={!filterColumn}
                popupOpen={itemWithPopup === idx}
                funcs={
                  this.funcs[idx] ||
                  (this.funcs[idx] = {
                    setTranslationItem: this.setTranslationItem,
                    register: this.registerFocusable(cell.id),
                    focus: this.changeFocus,
                    id: cell.id,
                    cell: cell,
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
        {this.renderUnlockBar(row)}
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

  const retrieveDisplayValue = (column, columnIdx, value) => {
    const displayValue =
      column.kind === "link"
        ? f.map(
            linkedRow => findDisplayValue(column.toTable)(linkedRow.id)(0),
            value
          )
        : findDisplayValue(table.id)(row.id)(columnIdx);

    // if displayValue was not found findDisplayValue returns either [] or [undefined]
    const displayValueFound = !f.isEmpty(displayValue) && f.head(displayValue);

    return displayValueFound ? displayValue : getDisplayValue(column, value);
  };

  const hiddenColIdces = f
    .prop(["columns", table.id, "data"], grudData)
    .reduce((idces, col, idx) => {
      if (col.hidden) idces.add(idx);
      return idces;
    }, new Set());

  // can not use this with default lodash.filter!
  const isNotHidden = (_, idx) => !hiddenColIdces.has(idx);

  const rowData =
    doto(
      grudData,
      f.prop(["rows", table.id, "data"]),
      f.find(f.propEq("id", row.id)),
      data => ({
        ...data,
        cells: f.propOr([], "cells", data).filter(isNotHidden),
        values: f.propOr([], "values", data).filter(isNotHidden)
      })
    ) || {};

  const cells = f
    .zip(rowData.cells, rowData.values)
    .map(([cell, cellValue], idx) => {
      return addCellId({
        ...cell,
        value: cellValue,
        row: rowData,
        displayValue: retrieveDisplayValue(cell.column, idx, cellValue)
      });
    });

  return { cells, row: rowData };
})(EntityViewBody);

EntityViewBody.propTypes = {
  langtag: PropTypes.string.isRequired,
  row: PropTypes.object.isRequired,
  registerForEvent: PropTypes.func.isRequired,
  filterColumn: PropTypes.object
};
