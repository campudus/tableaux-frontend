import React from "react";
import listensToClickOutside from "react-onclickoutside";
import * as f from "lodash/fp";
import i18n from "i18next";
import { either, maybe } from "../../helpers/functools";
// import ActionCreator from "../../actions/ActionCreator";
import { List } from "react-virtualized";
import {
  Directions,
  FallbackLanguage,
  FilterModes
} from "../../constants/TableauxConstants";
import SearchFunctions from "../../helpers/searchFunctions";
import KeyboardShortcutsHelper from "../../helpers/KeyboardShortcutsHelper";
import classNames from "classnames";
import PropTypes from "prop-types";

@listensToClickOutside
class ColumnFilterPopup extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      filteredColumns: this.props.columns.filter(this.buildFilter()),
      currFilter: null,
      selectedId: 0
    };
  }

  setFilter = (str, type = FilterModes.CONTAINS) => {
    const filter = {
      value: str,
      type: type
    };
    const { columns } = this.props;
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

  setVisibilityAndUpdateGrid(val, coll) {
    // ActionCreator.setColumnsVisibility(val, coll, () => maybe(this.list).method("forceUpdateGrid"));
  }

  setAll = val => () => {
    const columns = this.props.columns;
    const toggleIds = f.drop(1, columns).map(x => x.id); // get ids of all but first column
    this.setVisibilityAndUpdateGrid(val, toggleIds);
  };

  getKeyboardShortcuts = () => {
    const { columns } = this.props;
    const filteredColumns = this.props.columns.filter(this.buildFilter());
    const selectNext = dir => {
      const { selectedId } = this.state;
      const nextIdx =
        (selectedId + (dir === Directions.UP ? -1 : 1) + columns.length) %
        columns.length;
      this.setState({ selectedId: nextIdx });
    };
    return {
      enter: event => {
        this.toggleCol(columns[this.state.selectedId].id)(event);
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

  toggleCol = index => event => {
    event.stopPropagation();
    const { columns } = this.props;
    const theColumn = f.first(f.filter(x => x.id === index, columns));
    this.setVisibilityAndUpdateGrid(!theColumn.visible, [index]);
    this.forceUpdate();
  };

  getColName = col =>
    either(col)
      .map(f.prop(["displayName", this.props.langtag]))
      .orElse(f.prop(["displayName", FallbackLanguage]))
      .orElse(f.prop(["name"]))
      .getOrElseThrow("Could not extract displayName or name from  " + col);

  renderCheckboxItems = columns => ({ key, index, style }) => {
    const col = columns[index];
    const name = this.getColName(col);
    const {
      columnActions: { setColumnsVisible }
    } = this.props;

    const cssClass = classNames("column-filter-checkbox-wrapper", {
      even: index % 2 === 0 && index !== this.state.selectedId,
      odd: index % 2 === 1 && index !== this.state.selectedId,
      selected: index === this.state.selectedId
    });

    return (
      <div
        className={cssClass}
        key={key}
        style={style}
        onClick={() =>
          setColumnsVisible(
            f.compose(
              f.map("id"),
              f.filter("visible"),
              f.update([index, "visible"], isVisible => !isVisible)
            )(columns)
          )
        }
        onMouseEnter={() => this.setState({ selectedId: index })}
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
    const nHidden = f.flow(
      f.drop(1),
      f.reject("visible"),
      f.size
    )(columns);
    const filteredColumns = this.props.columns.filter(
      this.buildFilter(this.state.filter)
    );

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
        {f.isEmpty(filteredColumns) ? (
          <div className="no-column-search-result">
            {i18n.t("table:no-column-search-result")}
          </div>
        ) : (
          <List
            className="column-checkbox-list"
            ref={list => {
              this.list = list;
            }}
            width={440}
            height={300}
            rowCount={filteredColumns.length}
            rowHeight={30}
            scrollToIndex={this.state.selectedId}
            rowRenderer={this.renderCheckboxItems(filteredColumns)}
            style={{ overflowX: "hidden" }} // react-virtualized will override CSS overflow style, so set it here
          />
        )}
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
              onClick={() => hideAllColumns(tableId)}
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
