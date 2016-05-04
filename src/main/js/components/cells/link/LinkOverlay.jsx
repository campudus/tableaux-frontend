var React = require('react');
var AmpersandMixin = require('ampersand-react-mixin');
var _ = require('lodash');
var OverlayHeadRowIdentificator = require('../../overlay/OverlayHeadRowIdentificator.jsx');
var RowConcatHelper = require('../../../helpers/RowConcatHelper.js');
var ActionCreator = require('../../../actions/ActionCreator');
var XhrPoolMixin = require('../../mixins/XhrPoolMixin');
import shallowCompare from 'react-addons-shallow-compare'
import 'react-virtualized/styles.css';
import { VirtualScroll } from 'react-virtualized';

//we use this value to get the exact offset for the link list
const CSS_SEARCH_HEIGHT = 70;

var LinkOverlay = React.createClass({
  mixins : [AmpersandMixin, XhrPoolMixin],

  getInitialState : function () {
    return {
      search : "",
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
    var self = this;
    var toTableId = this.props.cell.column.toTable;
    var toTable = this.props.cell.tables.get(toTableId);

    /*
     * TODO: Combine both api calls. There's a api route available: http://localhost:8080/completetable/1
     * TBD: Ampersand Table Models
     */

    var rowXhr, colXhr;
    colXhr = toTable.columns.fetch({
      success : function () {
        rowXhr = toTable.rows.fetch({
          success : function () {
            //we just want the models, because we filter it later which returns the models
            self.allRowResults = toTable.rows.models;
            self.buildRowConcatString();
            self.setState({
              //we show all the rows
              rowResults : self.allRowResults,
              loading : false
            });
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

  onSearch : function (event) {
    this.filterRowsBySearch(this.refs.search.value);
  },

  //TODO: Implement to prebuild concat strings
  //Extends the model by a cached concat string
  buildRowConcatString : function () {

  },

  filterRowsBySearch : function (searchVal) {
    let newRowResults = {};
    var self = this;
    var {allRowResults} = this;
    var toColumn = self.props.cell.column.toColumn;
    var toTableId = this.props.cell.column.toTable;
    var toTable = this.props.cell.tables.get(toTableId);
    var toTableColumns = toTable.columns;
    var toIdColumnIndex = toTableColumns.indexOf(toTableColumns.get(toColumn.id)); //This is the index of the identifier / concat column
    searchVal = searchVal.toString().toLowerCase().trim();

    //check for empty obj or map fails
    if (searchVal !== "" && allRowResults.length > 0) {
      newRowResults = allRowResults.filter((row)=> {
        var rowConcatString = RowConcatHelper.getRowConcatStringWithFallback(row.values[toIdColumnIndex], toColumn, self.props.langtag).toLowerCase();
        var found = _.every(_.words(searchVal), function (word) {
          return rowConcatString.indexOf(word) > -1;
        });
        return found;
      });
    }

    //empty search value
    else if (searchVal === "") {
      newRowResults = allRowResults;
    }

    this.setState({
      search : searchVal,
      rowResults : newRowResults
    });
  },

  addLinkValue : function (isLinked, row, rowCellIdValue, event) {
    event.preventDefault();

    var cell = this.props.cell;

    var link = {
      id : row.id,
      value : rowCellIdValue
    };

    var links = _.clone(cell.value);

    if (isLinked) {
      _.remove(links, function (linked) {
        return row.id === linked.id;
      });
    } else {
      links.push(link);
    }
    ActionCreator.changeCell(cell.tableId, cell.rowId, cell.id, links);

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
    var self = this;
    var {rowResults} = this.state;
    var cell = this.props.cell;
    var toColumn = self.props.cell.column.toColumn;
    var currentCellValue = cell ? cell.value : null;
    var toTableId = this.props.cell.column.toTable;
    var toTable = this.props.cell.tables.get(toTableId);
    var toTableColumns = toTable.columns;
    var toIdColumnIndex = toTableColumns.indexOf(toTableColumns.get(toColumn.id)); //This is the index of the identifier / concat column
    var row = rowResults[index];

    //check for empty obj or map fails
    if (!_.isEmpty(rowResults) && !_.isEmpty(row)) {
      var isLinked = !!_.find(currentCellValue, function (link) {
        return link.id === row.id;
      });
      var rowCellIdValue = row.values[toIdColumnIndex];
      var rowConcatString = RowConcatHelper.getRowConcatStringWithFallback(rowCellIdValue, toColumn, self.props.langtag);
      return <a href="#" key={row.id} className={isLinked ? 'isLinked overlay-table-row' : 'overlay-table-row'}
                onClick={self.addLinkValue.bind(self, isLinked, row, rowCellIdValue)}>{rowConcatString}</a>;
    }
  },

  noRowsRenderer : function () {
    const {search} = this.state;

    if (search.length > 0) {
      return <div>no result with your search.</div>
    } else {
      return <div>Table has no rows.</div>;
    }
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
      /**
       * Issues:
       * tabindex -1 to skip focusing
       * right padding of 100% elements
       * after clicking an element, all visible rows are updated!!
       */
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
            <input type="text" className="search-input" placeholder="Search..." onChange={this.onSearch}
                   defaultValue={this.state.search} ref="search" autoFocus/>
            <i className="fa fa-search"></i>
          </div>
        </div>
        {listDisplay}
      </div>
    );
  }

});

module.exports = LinkOverlay;
