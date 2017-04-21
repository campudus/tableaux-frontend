import React, {Component, PropTypes} from "react";
import _ from "lodash";
import RowConcatHelper from "../../../helpers/RowConcatHelper.js";
import ActionCreator from "../../../actions/ActionCreator";
import "react-virtualized/styles.css";
import {List} from "react-virtualized";
import {translate} from "react-i18next";
import i18n from "i18next";
import {ActionTypes, Directions, FilterModes} from "../../../constants/TableauxConstants";
import {either} from "../../../helpers/monads";
import * as f from "lodash/fp";
import SearchFunctions, {SEARCH_FUNCTION_IDS} from "../../../helpers/searchFunctions";
import KeyboardShortcutsHelper from "../../../helpers/KeyboardShortcutsHelper";
import classNames from "classnames";
import apiUrl from "../../../helpers/apiUrl";
import withAbortableXhrRequests from "../../helperComponents/withAbortableXhrRequests";
import OverlayHeadRowIdentificator from "../../overlay/OverlayHeadRowIdentificator";
import Header from "../../overlay/Header";
import Dispatcher from "../../../dispatcher/Dispatcher";
import listensToClickOutside from "react-onclickoutside";
import {loadAndOpenEntityView} from "../../overlay/EntityViewOverlay";

// we use this value to get the exact offset for the link list
const CSS_SEARCH_HEIGHT = 70;
const MAIN_BUTTON = 0;
const LINK_BUTTON = 1;

@listensToClickOutside
class SearchBar extends Component {
  static propTypes = {
    langtag: PropTypes.string.isRequired
  };

  constructor(props) {
    super(props);
    this.state = {
      filterValue: "",
      filterMode: FilterModes.CONTAINS,
      popupOpen: false
    }
  }

  updateFilter = ({mode, value}) => {
    const {filterMode, filterValue} = this.state;
    const newValue = {
      filterMode: mode || filterMode,
      filterValue: (f.isString(value)) ? value : filterValue,
      popupOpen: false
    };
    this.setState(newValue, () => ActionCreator.filterLinksInOverlay(newValue));
  };

  handleClickOutside = event => {
    this.setState({popupOpen: false});
  };

  renderSearchOptions = () => {
    const {popupOpen, filterMode} = this.state;
    const activeIndex = f.findIndex(f.eq(filterMode), SEARCH_FUNCTION_IDS);
    return (popupOpen)
      ? (
        <div className="filter-option-popup">
          {
            SEARCH_FUNCTION_IDS.map(
              (id, idx) => {
                const name = i18n.t(SearchFunctions[id].displayName);
                const itemClass = classNames("menu-item", {"active": idx === activeIndex});
                return (
                  <div className={itemClass} key={id}>
                    <a className="menu-item-inner" href="#" onClick={() => this.updateFilter({mode: id})}>
                      {name}
                    </a>
                  </div>
                )
              }
            )
          }
        </div>
      )
      : null;
  };

  handleInputKeys = event => {
    const inputKey = f.prop(["target", "key"], event);

    const clearOrClose = () => {
      if (!f.isEmpty(this.state.filterValue)) {
        event.preventDefault();
        event.stopPropagation();
        this.setState({filterValue: ""}, () => this.updateFilter({mode: this.state.filterMode, value: this.state.filterValue}));
      }
      else {
        ActionCreator.closeOverlay();
      }
    };

    const passOnKey = () => {
      event.preventDefault();
      ActionCreator.passOnKeyStrokes({
        id: this.props.id,
        event
      })
    };

    const isIn = x => y => f.contains(f.toLower(y), f.map(f.toLower, x));

    f.cond([
      [f.eq("Escape"), clearOrClose],
      [isIn(["arrowup", "arrowdown", "tab", "enter"]), passOnKey],
      [f.stubTrue, f.noop]
    ])(event.key)
  };

  render() {
    const {filterMode, filterValue, popupOpen} = this.state;
    const filterName = i18n.t(SearchFunctions[filterMode].displayName);

    return (
      <div className="filter-bar">
        <input type="text"
               className="header-input"
               autoFocus
               value={filterValue}
               placeholder={filterName}
               onKeyDown={this.handleInputKeys}
               onChange={event => this.updateFilter({value: event.target.value})}
        />
        <a href="#" className="popup-button" onClick={() => this.setState({popupOpen: !popupOpen})}>
          <i className="fa fa-search" />
          <i className="fa fa-angle-down" />
        </a>
        {this.renderSearchOptions()}
      </div>
    );
  }
}

@translate(["table"])
@withAbortableXhrRequests
class LinkOverlay extends Component {

  constructor(props) {
    super(props);
    this.allRowResults = {};
    this.state = {
      rowResults: {},
      loading: true,
      filterMode: FilterModes.CONTAINS,
      filterModePopupOpen: false,
      selectedId: 0,
      selectedMode: 0
    };
  }

  static propTypes = {
    cell: PropTypes.object.isRequired,
    langtag: PropTypes.string.isRequired,
    tableId: PropTypes.number
  };

  componentDidMount = () => { // why is componentWillMount never called?
    Dispatcher.on(ActionTypes.FILTER_LINKS, this.setFilterMode);
    Dispatcher.on(ActionTypes.PASS_ON_KEYSTROKES, this.handleMyKeys);
  };

  componentWillUnmount = () => {
    Dispatcher.off(ActionTypes.FILTER_LINKS, this.setFilterMode);
    Dispatcher.off(ActionTypes.PASS_ON_KEYSTROKES, this.handleMyKeys);
  };

  handleMyKeys = ({id, event}) => {
    if (id === this.props.id) {
      KeyboardShortcutsHelper.onKeyboardShortcut(this.getKeyboardShortcuts)(event);
    }
  };

  getKeyboardShortcuts = () => {
    const rows = this.state.rowResults;
    const {selectedMode} = this.state;
    const selectNext = (dir) => {
      const {selectedId} = this.state;
      const nextIdx = (selectedId + ((dir === Directions.UP) ? -1 : 1) + rows.length) % rows.length;
      this.setState({selectedId: nextIdx}, () => this.refs.OverlayScroll.forceUpdateGrid());
    };
    return {
      enter: event => {
        if (selectedMode === MAIN_BUTTON) {
          const row = this.state.rowResults[this.state.selectedId];
          this.addLinkValue.call(this, this.isRowLinked(row), row, event);
        } else {
          const {cell} = this.props;
          const {rowResults, selectedId} = this.state;
          const row = rowResults[selectedId];
          const target = {
            tables: cell.tables,
            tableId: cell.column.toTable,
            rowId: row.id
          };
          loadAndOpenEntityView(target, this.props.langtag);
        }
      },
      escape: event => {
        event.preventDefault();
        event.stopPropagation();
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
      },
      right: event => {
        event.preventDefault();
        event.stopPropagation();
        this.setState({selectedMode: LINK_BUTTON}, () => this.refs.OverlayScroll.forceUpdateGrid());
      },
      left: event => {
        event.preventDefault();
        event.stopPropagation();
        this.setState({selectedMode: MAIN_BUTTON}, () => this.refs.OverlayScroll.forceUpdateGrid());
      },
      tab: event => {
        event.preventDefault();
        event.stopPropagation();
        this.setState({selectedMode: (selectedMode + 1) % 2}, () => this.refs.OverlayScroll.forceUpdateGrid());
      }
    };
  };

  componentWillMount = () => {
    let toTableId = this.props.cell.column.toTable;
    let toTable = this.props.cell.tables.get(toTableId);

    // Data already fetched, show it instantly and update it in the background
    if (toTable.rows.length > 0) {
      this.setRowResult(toTable.rows);
    }

    const fetchColumns = new Promise(
      (resolve, reject) => {
        const colXhr = toTable.columns.fetch({
          success: resolve,
          error: reject
        });
        this.props.addAbortableXhrRequest(colXhr);
      }
    );

    const fetchRows = new Promise(
      (resolve, reject) => {
        const rowXhr = toTable.rows.fetch({
          url: apiUrl("/tables/" + toTableId + "/columns/first/rows"),
          success: () => {
            this.setRowResult(toTable.rows, true);
            resolve();
          },
          error: reject
        });
        this.props.addAbortableXhrRequest(rowXhr);
      }
    );

    fetchColumns.then(fetchRows);
  };

  getCurrentSearchValue = () => {
    const {filterValue, filterMode} = this.state;
    return {
      filterMode,
      filterValue
    };
  };

  onSearch = (event) => {
    this.setState({
      rowResults: this.filterRowsBySearch(this.getCurrentSearchValue()),
      selectedId: 0
    });
  };

  // we set the row result depending if a search value is set
  setRowResult = (rowResult, fromServer) => {
    // just set the models, because we filter it later which also returns the models.
    this.allRowResults = rowResult.models;
    // we always rebuild the row names, also to prevent wrong display names when switching languages
    this.buildRowConcatString();
    this.setState({
      // we show all the rows
      rowResults: this.filterRowsBySearch(this.getCurrentSearchValue()),
      loading: false
    });
  };

  // Extends the model by a cached row name string
  buildRowConcatString = () => {
    const {allRowResults, props: {cell: {column: {toColumn}}}} = this;
    _.forEach(allRowResults, (row) => {
      row["cachedRowName"] = RowConcatHelper.getCellAsStringWithFallback(this.getRowValues(row),
        toColumn,
        this.props.langtag);
    });
  };

  getRowValues = (row) => {
    const {toColumn, toTable} = this.props.cell.column;
    const toTableObj = this.props.cell.tables.get(toTable);
    const toTableColumns = toTableObj.columns;
    const toIdColumnIndex = toTableColumns.indexOf(toTableColumns.get(toColumn.id)); // This is the index of the
                                                                                     // identifier / concat column 
    return row.values[toIdColumnIndex];
  };

  setFilterMode = ({filterMode = FilterModes.CONTAINS, filterValue = ""}) => {
    this.setState({
        filterMode,
        filterValue
      },
      () => this.onSearch());
  };

  filterRowsBySearch = (searchParams) => {
    const {filterValue, filterMode} = searchParams;
    const searchFunction = SearchFunctions[filterMode];
    const {allRowResults} = this;
    const lowerCaseRowId = f.compose(f.toLower, f.trim, f.prop("cachedRowId"));
    const linkedRows = f.compose(
      f.sortBy(lowerCaseRowId),
      f.filter(this.isRowLinked)
    )(allRowResults);
    const unlinkedRows = f.reject(this.isRowLinked, allRowResults);

    const byCachedRowName = f.compose(searchFunction(filterValue), f.prop("cachedRowName"));
    if (filterValue !== "" && allRowResults.length > 0) {
      return [...linkedRows, ...unlinkedRows.filter(byCachedRowName)];
    } else {
      return [...linkedRows, ...unlinkedRows];
    }
  };

  addLinkValue = (isLinked, row, event) => {
    event.preventDefault();
    const cell = this.props.cell;
    const rowCellIdValue = this.getRowValues(row);
    const link = {
      id: row.id,
      value: rowCellIdValue
    };
    let links = _.clone(cell.value);

    if (isLinked) {
      _.remove(links, function (linked) {
        return row.id === linked.id;
      });
    } else {
      links.push(link);
    }
    ActionCreator.changeCell(cell, links);
    this.setState({rowResults: this.filterRowsBySearch(this.getCurrentSearchValue())});
    // tell the virtual scroller to redraw
    this.refs.OverlayScroll.forceUpdateGrid();
  };

  closeOverlay = () => {
    ActionCreator.closeOverlay();
  };

  isRowLinked = (row) => {
    const currentCellValue = either(this.props.cell)
      .map(f.prop(["value"]))
      .getOrElse(null);
    return !!_.find(currentCellValue, link => link.id === row.id);
  };

  getOverlayItem = ({
                      key,         // Unique key within array of rows
                      index,       // Index of row within collection
                      style        // Style object to be applied to row (to position it)
                    }) => {
    const {rowResults, selectedId, selectedMode} = this.state;
    const row = rowResults[index];

    if (!_.isEmpty(rowResults) && !_.isEmpty(row)) {
      const isLinked = this.isRowLinked(row);
      const isSelected = selectedId === index;
      const rowName = row["cachedRowName"];
      const rowCssClass = classNames("list-item",
        {
          "isLinked": isLinked,
          "selected": isSelected
        });
      const {langtag, cell} = this.props;

      const mainButtonClass = classNames("left", {
        "linked": isLinked,
        "has-focus": selectedMode === MAIN_BUTTON
      });
      const linkButtonClass = classNames("right",
        {
          "has-focus": selectedMode === LINK_BUTTON,
          "linked": isLinked
        });

      return (isSelected)
        ? (
          <div style={style} key={key}>
            <div className={rowCssClass}>
              <div className={mainButtonClass}
                   onMouseOver={() => this.setState({selectedMode: MAIN_BUTTON},
                     () => this.refs.OverlayScroll.forceUpdateGrid())}
              >
                <a href="#" onClick={this.addLinkValue.bind(this, isLinked, row)}>
                  {rowName}
                  <i className={(isLinked) ? "fa fa-times" : "fa fa-check"} />
                </a>

              </div>
              <a href="#" className={linkButtonClass}
                 onClick={() => loadAndOpenEntityView({
                   tables: cell.tables,
                   tableId: cell.column.toTable,
                   rowId: row.id
                 }, langtag)}
                 onMouseOver={() => this.setState({selectedMode: LINK_BUTTON},
                   () => this.refs.OverlayScroll.forceUpdateGrid())}
              >
                <i className="fa fa-long-arrow-right" />
              </a>
            </div>
          </div>
        )
        : (
          <div style={style} key={key} onMouseEnter={() => this.setState({selectedId: index})}>
            <div className={rowCssClass}>
              {rowName}
            </div>
          </div>
        );
    }
  };

  noRowsRenderer = () => {
    const {t} = this.props;
    return (
      <div className="empty">
        {this.getCurrentSearchValue().length > 0 ? t("search_no_results") : t("overlay_no_rows_in_table")}
      </div>);
  };

  render = () => {
    let listDisplay;
    const {rowResults, loading} = this.state;
    const contentHeight = (0.8 * window.innerHeight) | 0;
    const contentWidth = (0.6 * window.innerWidth) | 0;
    const rowsCount = rowResults.length || 0;

    if (loading) {
      listDisplay = "Loading...";
    } else {
      listDisplay = (
        <List
          ref="OverlayScroll"
          width={contentWidth}
          height={contentHeight - CSS_SEARCH_HEIGHT}
          rowCount={rowsCount}
          rowHeight={40}
          rowRenderer={this.getOverlayItem}
          scrollToIndex={this.state.selectedId}
          noRowsRenderer={this.noRowsRenderer}
        />
      );
    }

    return (
      <div onKeyDown={KeyboardShortcutsHelper.onKeyboardShortcut(this.getKeyboardShortcuts)}
           className="link-overlay"
           tabIndex={1}
           onMouseOver={e => e.target.focus()}
      >
        {listDisplay}
      </div>
    );
  }
}

export const openLinkOverlay = (cell, langtag) => {
  const table = cell.tables.get(cell.tableId);
  const tableName = table.displayName[langtag] || table.displayName[FallbackLanguage];
  ActionCreator.openOverlay({
    head: <Header context={tableName}
                  title={<OverlayHeadRowIdentificator cell={cell} langtag={langtag} />}
                  components={<SearchBar langtag={langtag} />}
    />,
    body: <LinkOverlay cell={cell} langtag={langtag} />,
    type: "full-height"
  });
};

export default LinkOverlay;
