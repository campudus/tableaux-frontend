const React = require('react');
const _ = require('lodash');
const OverlayHeadRowIdentificator = require('../../overlay/OverlayHeadRowIdentificator.jsx');
const RowConcatHelper = require('../../../helpers/RowConcatHelper.js');
const ActionCreator = require('../../../actions/ActionCreator');
const XhrPoolMixin = require('../../mixins/XhrPoolMixin');
import "react-virtualized/styles.css";
import {List} from "react-virtualized";
import {translate} from "react-i18next";
import i18n from "i18next";
import {FilterModes, Directions} from "../../../constants/TableauxConstants";
import {either} from "../../../helpers/monads";
import * as f from "lodash/fp";
import SearchFunctions from "../../../helpers/searchFunctions";
import FilterModePopup from "../../header/filter/FilterModePopup";
import KeyboardShortcutsHelper from "../../../helpers/KeyboardShortcutsHelper";
import classNames from "classnames";
const apiUrl = require('../../../helpers/apiUrl');

//we use this value to get the exact offset for the link list
const CSS_SEARCH_HEIGHT = 70;

const LinkOverlay = React.createClass({
  mixins: [XhrPoolMixin],

  getInitialState: function () {
    return {
      rowResults: {},
      loading: true,
      filterMode: FilterModes.CONTAINS,
      filterModePopupOpen: false,
      selected: 0
    };
  },

  propTypes: {
    cell: React.PropTypes.object,
    langtag: React.PropTypes.string.isRequired,
    tableId: React.PropTypes.number,
    contentHeight: React.PropTypes.number,
    contentWidth: React.PropTypes.number
  },

  //saves all the results from server
  allRowResults: {},

  getKeyboardShortcuts: function() {
    const rows = this.state.rowResults;
    const selectNext = (dir) => {
      const {selected} = this.state;
      const nextIdx = (selected + ((dir === Directions.UP) ? -1 : 1) + rows.length) % rows.length;
      this.setState({selected: nextIdx});
    };
    return {
      enter: event => {
        const row = this.state.rowResults[this.state.selected];
        this.addLinkValue.call(this, this.isRowLinked(row), row, event);
      },
      escape: event => {
        event.preventDefault();
        event.stopPropagation();
        if (this.refs.search.value === "") {
          this.closeOverlay();
        } else {
          this.refs.search.value = "";
          this.onSearch();
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
      },
    }
  },

  componentWillMount: function () {
    let self = this;
    let toTableId = this.props.cell.column.toTable;
    let toTable = this.props.cell.tables.get(toTableId);
    let rowXhr, colXhr;

    //Data already fetched, show it instantly and update it in the background
    if (toTable.rows.length > 0) {
      self.setRowResult(toTable.rows);
    }

    colXhr = toTable.columns.fetch({
      success: function () {
        rowXhr = toTable.rows.fetch({
          url: apiUrl('/tables/' + toTableId + '/columns/first/rows'),
          success: function () {
            self.setRowResult(toTable.rows, true);
          },
          error: function (err) {
            console.log('error fetching rows', err);
          }
        });
        self.addAbortableXhrRequest(rowXhr);
      },
      error: function (err) {
        console.log("error fetching columns", err);
      }
    });
    self.addAbortableXhrRequest(colXhr);
  },

  /**
   * Get the input string of the search field
   * @returns {Object} Search value lowercased and trimmed, current filter mode
   */
  getCurrentSearchValue: function () {
    const searchVal = either(this.refs)
      .map(f.prop(["search", "value"]))
      .map(f.trim)
      .map(f.toLower)
      .map(f.toString)
      .getOrElse("");
    return {
      searchVal: searchVal,
      filterMode: this.state.filterMode
    }
  },

  onSearch: function (event) {
    this.setState({
      rowResults: this.filterRowsBySearch(this.getCurrentSearchValue()),
      selected: 0
    });
  },

  //we set the row result depending if a search value is set
  setRowResult: function (rowResult, fromServer) {
    //just set the models, because we filter it later which also returns the models.
    this.allRowResults = rowResult.models;
    //we always rebuild the row names, also to prevent wrong display names when switching languages
    this.buildRowConcatString();
    this.setState({
      //we show all the rows
      rowResults: this.filterRowsBySearch(this.getCurrentSearchValue()),
      loading: false
    });
  },

  //Extends the model by a cached row name string
  buildRowConcatString: function () {
    const {allRowResults, props:{cell:{column:{toColumn}}}} = this;
    _.forEach(allRowResults, (row) => {
      row["cachedRowName"] = RowConcatHelper.getCellAsStringWithFallback(this.getRowValues(row),
        toColumn,
        this.props.langtag);
    });
  },

  getRowValues: function (row) {
    const {toColumn, toTable} = this.props.cell.column;
    const toTableObj = this.props.cell.tables.get(toTable);
    const toTableColumns = toTableObj.columns;
    const toIdColumnIndex = toTableColumns.indexOf(toTableColumns.get(toColumn.id)); //This is the index of the
                                                                                     // identifier / concat column 
    return row.values[toIdColumnIndex];
  },

  toggleFilterModesPopup: function () {
    this.setState({filterModePopupOpen: !this.state.filterModePopupOpen});
  },

  setFilterMode: function (modeString) {
    this.setState({filterMode: modeString}, this.onSearch);
  },

  renderFilterModePopup: function () {
    const active = (this.state.filterMode === FilterModes.CONTAINS) ? 0 : 1;
    return (
      <FilterModePopup x={0} y={0}
                       active={active}
                       setFilterMode={this.setFilterMode}
                       close={this.toggleFilterModesPopup}
      />)
  },

  //searchval is already trimmed and to lowercase
  filterRowsBySearch: function (searchParams) {
    const {searchVal, filterMode} = searchParams;
    const searchFunction = SearchFunctions[filterMode];
    const {allRowResults} = this;

    if (searchVal !== "" && allRowResults.length > 0) {
      const byCachedRowName = f.compose(searchFunction(searchVal), f.prop("cachedRowName"));
      return allRowResults.filter(byCachedRowName);
    } else {
      return allRowResults;
    }
  },

  addLinkValue: function (isLinked, row, event) {
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

    //tell the virtual scroller to redraw
    this.refs.OverlayScroll.forceUpdateGrid();
  },

  closeOverlay: function () {
    ActionCreator.closeOverlay();
  },

  stringHasValue: function (stringToCheck) {
    return (stringToCheck && stringToCheck.trim() !== "");
  },

  isRowLinked: function(row) {
    const currentCellValue = either(this.props.cell)
      .map(f.prop(["value"]))
      .getOrElse(null);
    return !!_.find(currentCellValue, link => link.id === row.id)
  },

  getOverlayItem: function (
    {
      key,         // Unique key within array of rows
      index,       // Index of row within collection
      style        // Style object to be applied to row (to position it)
    }
  ) {
    const {rowResults,selected} = this.state;
    const row = rowResults[index];

    if (!_.isEmpty(rowResults) && !_.isEmpty(row)) {
      const isLinked = this.isRowLinked(row);
      const rowName = row["cachedRowName"];
      const rowCssClass = classNames("overlay-table-row",
        {
          "isLinked": isLinked,
          "selected": selected === index
        });

      return <div style={style} key={key}>
        <a href="#"
           className={rowCssClass}
           onClick={this.addLinkValue.bind(this, isLinked, row)}
           onMouseEnter={() => this.setState({selected: index})}
        >
          {rowName}
        </a>
      </div>;
    }
  },

  noRowsRenderer: function () {
    const {t} = this.props;
    return (
      <div className="error">
        {this.getCurrentSearchValue().length > 0 ? t('search_no_results') : t('overlay_no_rows_in_table')}
      </div>);
  },

  render: function () {
    let listDisplay;
    const {rowResults, loading} = this.state;
    const {contentHeight, contentWidth} = this.props;
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
          rowHeight={50}
          rowRenderer={this.getOverlayItem}
          scrollToIndex={this.state.selected}
          noRowsRenderer={this.noRowsRenderer}
        />
      );
    }

    const placeholder = (this.state.filterMode === FilterModes.CONTAINS)
      ? "table:filter.contains"
      : "table:filter.starts_with";

    const popupOpen = this.state.filterModePopupOpen;
    return (
      <div onKeyDown={KeyboardShortcutsHelper.onKeyboardShortcut(this.getKeyboardShortcuts)}>
        {(popupOpen)
          ? this.renderFilterModePopup()
          : null
        }
        <div className="search-input-wrapper2" style={{height: CSS_SEARCH_HEIGHT}} >
          <div className="search-input-wrapper">
            <input type="text"
                   className="search-input"
                   placeholder={i18n.t(placeholder) + "..."}
                   onChange={this.onSearch}
                   ref="search"
                   autoFocus />
            <a href="#" className={"ignore-react-onclickoutside" + ((popupOpen) ? " active" : "")}
               onClick={this.toggleFilterModesPopup}>
              <i className="fa fa-search"></i>
              <i className="fa fa-angle-down"></i>
            </a>
          </div>
        </div>
        {listDisplay}
      </div>
    );
  }

});

module.exports = translate(['table'])(LinkOverlay);
