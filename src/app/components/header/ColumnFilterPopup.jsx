import React from "react";
import * as f from "lodash/fp";
import i18n from "i18next";
import listensToClickOutside from "react-onclickoutside";

import PropTypes from "prop-types";
import classNames from "classnames";

import { either } from "../../helpers/functools";
import { List } from "react-virtualized";
import DragSortList from "../cells/link/DragSortList";
import { getColumnDisplayName } from "../../helpers/multiLanguage";
import {
  Directions,
  FallbackLanguage,
  FilterModes
} from "../../constants/TableauxConstants";
import SearchFunctions from "../../helpers/searchFunctions";
import KeyboardShortcutsHelper from "../../helpers/KeyboardShortcutsHelper";

@listensToClickOutside
class ColumnFilterPopup extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      filter: null,
      selectedIndex: 0
    };
  }

  setFilter = (str, type = FilterModes.CONTAINS) => {
    const filter = {
      value: str,
      type: type
    };

    this.setState({
      filter: filter
    });
  };

  // returns a true/false filter function accepting one argument
  buildFilter = filter => {
    const { columns } = this.props;
    const lvl1 = col => col !== f.first(columns); // ignore ID column
    const lvl2 = filter
      ? f.flow(
          this.getColName,
          SearchFunctions[filter.type](filter.value)
        )
      : f.stubTrue; // ...or pass all
    return f.allPass([lvl1, lvl2]);
  };

  handleClickOutside = event => {
    event.preventDefault();
    this.props.close(event);
  };

  getKeyboardShortcuts = () => {
    const {
      columns,
      columnActions: { toggleColumnVisibility }
    } = this.props;
    const { selectedIndex } = this.state;
    const selectNext = dir => {
      const nextIdx =
        (selectedIndex + (dir === Directions.UP ? -1 : 1) + columns.length) %
        columns.length;
      this.setState({ selectedIndex: nextIdx });
    };

    return {
      enter: event => {
        event.preventDefault();
        event.stopPropagation();
        const selectedColumnId = f.get("id", columns[selectedIndex + 1]);
        toggleColumnVisibility(selectedColumnId);
      },
      escape: event => {
        event.preventDefault();
        event.stopPropagation();
        if (this.searchBar.value === "") {
          this.props.close(event);
        } else {
          this.searchBar.value = "";
          this.setFilter("");
        }
      },
      up: event => {
        event.preventDefault();
        event.stopPropagation();
        selectNext(Directions.UP);
      },
      down: event => {
        event.preventDefault();
        event.stopPropagation();
        selectNext(Directions.DOWN);
      }
    };
  };

  applyColumnOrdering = columns => newOrdering => () => {
    const {
      columnActions: { setColumnOrdering }
    } = this.props;
    const mapOrderingToIndices = f.map(colId => ({
      id: colId,
      idx: f.findIndex(({ id }) => id === colId, columns)
    }));

    return f.compose(
      setColumnOrdering,
      mapOrderingToIndices,
      f.concat([0])
    )(newOrdering);
  };

  assignListRef = list => (this.list = list);

  renderColumnList = (filteredColumns, selectedIndex) => {
    const { columns, columnOrdering } = this.props;
    const sharedListProps = {
      className: "column-checkbox-list",
      width: 440,
      height: 300,
      rowCount: filteredColumns.length,
      rowHeight: 30,
      scrollToIndex: selectedIndex,
      style: { overflowX: "hidden" },
      ref: this.assignListRef
    };
    if (f.isEmpty(filteredColumns)) {
      return (
        <div className="no-column-search-result">
          {i18n.t("table:no-column-search-result")}
        </div>
      );
    } else if (columns.length - 1 !== filteredColumns.length) {
      return (
        <List
          {...sharedListProps}
          rowRenderer={this.renderCheckboxItems(filteredColumns, true)}
        />
      );
    } else {
      return (
        <DragSortList
          {...sharedListProps}
          wrapperClass="column-checkbox-list"
          renderListItem={this.renderCheckboxItems(columns, false)}
          applySwap={this.applyColumnOrdering(columns)}
          entries={f.compose(
            f.tail,
            f.map("id")
          )(columnOrdering)}
        />
      );
    }
  };

  getColName = col =>
    either(col)
      .map(_column => getColumnDisplayName(_column, this.props.langtag))
      .getOrElseThrow("Could not extract displayName or name from  " + col);

  renderCheckboxItems = (columns, renderByIndex) => ({ key, index, style }) => {
    const col = renderByIndex
      ? columns[index]
      : f.find(({ id }) => id === key, columns);
    const name = this.getColName(col);
    const {
      columnActions: { toggleColumnVisibility }
    } = this.props;
    const { selectedIndex } = this.state;

    const cssClass = classNames("column-filter-checkbox-wrapper", {
      even: index % 2 === 0 && index !== selectedIndex,
      odd: index % 2 === 1 && index !== selectedIndex,
      selected: index === selectedIndex
    });

    return (
      <div
        className={cssClass}
        key={key}
        style={style}
        onClick={() => toggleColumnVisibility(col.id)}
        onMouseEnter={() => this.setState({ selectedIndex: index })}
      >
        <input
          type="checkbox"
          checked={col.visible}
          onChange={() => {}} // to avoid React warning "unmanaged input"
        />
        {name}
      </div>
    );
  };

  handleFilterChange = event => {
    event.stopPropagation();
    event.preventDefault();
    const value = event.target.value;
    this.setFilter(value);
  };

  render = () => {
    const {
      columns,
      columnActions: { hideAllColumns, setColumnsVisible },
      tableId
    } = this.props;
    const { filter, selectedIndex } = this.state;
    const nHidden = f.flow(
      f.drop(1),
      f.reject("visible"),
      f.size
    )(columns);
    const filteredColumns = columns.filter(this.buildFilter(filter));

    return (
      <div
        id="column-filter-popup-wrapper"
        onKeyDown={KeyboardShortcutsHelper.onKeyboardShortcut(
          this.getKeyboardShortcuts
        )}
      >
        <div className="row infotext header-text">
          <i className="fa fa-eye" />
          {i18n.t("table:hide_unhide")}
        </div>
        <div className="wrap-me-grey">
          <div className="filter-input row">
            <input
              type="text"
              className="input"
              placeholder={i18n.t("table:filter_columns")}
              onChange={this.handleFilterChange}
              ref={input => {
                this.searchBar = input;
              }}
              autoFocus
            />
          </div>
        </div>
        {this.renderColumnList(filteredColumns, selectedIndex)}
        <div className="row infotext">
          <span>{nHidden + " " + i18n.t("table:hidden_items")}</span>
        </div>
        <div className="wrap-me-grey">
          <div className="row">
            <a
              href="#"
              className="button positive"
              onClick={() => setColumnsVisible(f.map("id", columns))}
            >
              {i18n.t("table:show_all_columns")}
            </a>
            <a
              href="#"
              className="button neutral"
              onClick={() => hideAllColumns(tableId, columns)}
            >
              {i18n.t("table:hide_all_columns")}
            </a>
          </div>
        </div>
      </div>
    );
  };
}

ColumnFilterPopup.propTypes = {
  close: PropTypes.func.isRequired,
  langtag: PropTypes.string.isRequired,
  columns: PropTypes.array.isRequired
};

export default ColumnFilterPopup;
