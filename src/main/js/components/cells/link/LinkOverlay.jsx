const React = require('react');
const _ = require('lodash');
const OverlayHeadRowIdentificator = require('../../overlay/OverlayHeadRowIdentificator.jsx');
const RowConcatHelper = require('../../../helpers/RowConcatHelper.js');
const ActionCreator = require('../../../actions/ActionCreator');
const XhrPoolMixin = require('../../mixins/XhrPoolMixin');
import shallowCompare from 'react-addons-shallow-compare';
import 'react-virtualized/styles.css';
import { VirtualScroll } from 'react-virtualized';
import {translate} from 'react-i18next';
var apiUrl = require('../../../helpers/apiUrl');

//we use this value to get the exact offset for the link list
const CSS_SEARCH_HEIGHT = 70;

const LinkOverlay = React.createClass({
  mixins : [XhrPoolMixin],

  getInitialState : function () {
    return {
      rowResults : {},
      loading : true
    };
  },

  propTypes : {
    cell : React.PropTypes.object,
    langtag : React.PropTypes.string.isRequired,
    tableId : React.PropTypes.number,
    contentHeight : React.PropTypes.number,
    contentWidth : React.PropTypes.number
  },

  //saves all the results from server
  allRowResults : {},

  componentWillMount : function () {
    let self = this;
    let toTableId = this.props.cell.column.toTable;
    let toTable = this.props.cell.tables.get(toTableId);
    let rowXhr, colXhr;

    //Data already fetched, show it instantly and update it in the background
    if (toTable.rows.length > 0) {
      self.setRowResult(toTable.rows);
    }

    colXhr = toTable.columns.fetch({
      success : function () {
        rowXhr = toTable.rows.fetch({
          url : apiUrl('/tables/' + toTableId + '/columns/first/rows'),
          success : function () {
            self.setRowResult(toTable.rows, true);
          },
          error : function (err) {
            console.log('error fetching rows', err);
          }
        });
        self.addAbortableXhrRequest(rowXhr);
      },
      error : function (err) {
        console.log("error fetching columns", err);
      }
    });
    self.addAbortableXhrRequest(colXhr);
  },

  /**
   * Get the input string of the search field
   * @returns {String} Search value lowercased and trimmed
   */
  getCurrentSearchValue : function () {
    const searchRef = this.refs.search;
    if (searchRef) {
      let searchVal = this.refs.search.value;
      return searchVal.toString().toLowerCase().trim();
    } else {
      return "";
    }
  },

  onSearch : function (event) {
    this.setState({
      rowResults : this.filterRowsBySearch(this.getCurrentSearchValue())
    });
  },

  //we set the row result depending if a search value is set
  setRowResult : function (rowResult, fromServer) {
    //just set the models, because we filter it later which also returns the models.
    this.allRowResults = rowResult.models;
    //we always rebuild the row names, also to prevent wrong display names when switching languages
    this.buildRowConcatString();
    this.setState({
      //we show all the rows
      rowResults : this.filterRowsBySearch(this.getCurrentSearchValue()),
      loading : false
    });
  },

  //Extends the model by a cached row name string
  buildRowConcatString : function () {
    const {allRowResults, props:{cell:{column:{toColumn}}}} = this;
    _.forEach(allRowResults, (row)=> {
      row["cachedRowName"] = RowConcatHelper.getCellAsStringWithFallback(this.getRowValues(row), toColumn, this.props.langtag);
    });
  },

  getRowValues : function (row) {
    const {toColumn, toTable} = this.props.cell.column;
    const toTableObj = this.props.cell.tables.get(toTable);
    const toTableColumns = toTableObj.columns;
    const toIdColumnIndex = toTableColumns.indexOf(toTableColumns.get(toColumn.id)); //This is the index of the identifier / concat column 
    return row.values[toIdColumnIndex];
  },

  //searchval is already trimmed and to lowercase
  filterRowsBySearch : function (searchVal) {
    let newRowResults = {};
    let {allRowResults} = this;

    if (searchVal !== "" && allRowResults.length > 0) {
      newRowResults = allRowResults.filter((row)=> {
        let rowName = row["cachedRowName"].toLowerCase();
        return _.every(_.words(searchVal), function (word) {
          return rowName.indexOf(word) > -1;
        });
      });
    }
    else {
      newRowResults = allRowResults;
    }
    return newRowResults;
  },

  addLinkValue : function (isLinked, row, event) {
    event.preventDefault();
    const cell = this.props.cell;
    const rowCellIdValue = this.getRowValues(row);

    const link = {
      id : row.id,
      value : rowCellIdValue
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
    this.refs.OverlayScroll.forceUpdate();
  },

  closeOverlay : function () {
    ActionCreator.closeOverlay();
  },

  stringHasValue : function (stringToCheck) {
    return (stringToCheck && stringToCheck.trim() !== "");
  },

  getOverlayItem : function (index) {
    let {rowResults} = this.state;
    let {cell} = this.props;
    let currentCellValue = cell ? cell.value : null;
    let row = rowResults[index];

    if (!_.isEmpty(rowResults) && !_.isEmpty(row)) {
      let isLinked = !!_.find(currentCellValue, (link) => {
        return link.id === row.id;
      });
      let rowName = row["cachedRowName"];
      return <a href="#" key={row.id} className={isLinked ? 'isLinked overlay-table-row' : 'overlay-table-row'}
                onClick={this.addLinkValue.bind(this, isLinked, row)}>{rowName}</a>;
    }
  },

  noRowsRenderer : function () {
    const {t} = this.props;
    return (
      <div className="error">
        {this.getCurrentSearchValue().length > 0 ? t('search_no_results') : t('overlay_no_rows_in_table')}
      </div>);
  },

  render : function () {
    let listDisplay;
    const {rowResults, loading} = this.state;
    const {contentHeight, contentWidth} = this.props;
    const rowsCount = rowResults.length || 0;

    if (loading) {
      listDisplay = "Loading...";
    } else {
      listDisplay = (
        <VirtualScroll
          ref="OverlayScroll"
          width={contentWidth}
          height={contentHeight - CSS_SEARCH_HEIGHT}
          rowsCount={rowsCount}
          rowHeight={50}
          rowRenderer={this.getOverlayItem}
          noRowsRenderer={this.noRowsRenderer}
        />
      );
    }

    return (
      <div>
        <div className="search-input-wrapper2" style={{height:CSS_SEARCH_HEIGHT}}>
          <div className="search-input-wrapper">
            <input type="text" className="search-input" placeholder="Search..." onChange={this.onSearch} ref="search"
                   autoFocus/>
            <i className="fa fa-search"></i>
          </div>
        </div>
        {listDisplay}
      </div>
    );
  }

});

module.exports = translate(['table'])(LinkOverlay);
