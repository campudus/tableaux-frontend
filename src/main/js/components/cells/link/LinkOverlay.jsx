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
    tableId : React.PropTypes.number
  },

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
            console.log("set rowResults to:", toTable.rows);
            self.setState({
              rowResults : toTable.rows,
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
    var search = this.refs.search.value;
    this.setState({
      search : search
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
    console.log("get overlay item at index:", index);
    var self = this;
    var {rowResults} = this.state;
    var cell = this.props.cell;
    var toColumn = self.props.cell.column.toColumn;
    var currentCellValue = cell ? cell.value : null;
    var toTableId = this.props.cell.column.toTable;
    var toTable = this.props.cell.tables.get(toTableId);
    var toTableColumns = toTable.columns;
    var toIdColumnIndex = toTableColumns.indexOf(toTableColumns.get(toColumn.id)); //This is the index of the identifier / concat column
    var row = rowResults.at(index);

    //check for empty obj or map fails
    if (!_.isEmpty(rowResults) && !_.isEmpty(row)) {
      var rowConcatString;
      var isLinked = !!_.find(currentCellValue, function (link) {
        return link.id === row.id;
      });
      var rowCellIdValue = row.values[toIdColumnIndex];
      rowConcatString = RowConcatHelper.getRowConcatStringWithFallback(rowCellIdValue, toColumn, self.props.langtag);

      //Search filter
      if (_.isString(rowConcatString) && self.state.search !== null) {
        var found = _.every(_.words(self.state.search.toString().toLowerCase().trim()), function (word) {
          return rowConcatString.toLowerCase().indexOf(word) > -1;
        });

        if (found) {
          if (rowConcatString && rowConcatString !== "") {
            return <a href="#" key={row.id} className={isLinked ? 'isLinked overlay-table-row' : 'overlay-table-row'}
                      onClick={self.addLinkValue.bind(self, isLinked, row, rowCellIdValue)}>{rowConcatString}</a>;
          } else {
            return null;
          }
        }
      }
    }
    return null;
  },

  noRowsRenderer : function () {
    console.log("no rows a rendered");
  },

  render : function () {
    var listDisplay;
    let {rowResults, loading} = this.state;

    if (loading) {
      listDisplay = "Loading...";
    } else {
      console.log("render virtualscroll");
      listDisplay = (
      /**
       * Issues:
       * tabindex -1 to skip focusing
       * right padding of 100% elements
       * after clicking an element, all visible rows are updated!!
       */
        <VirtualScroll
          ref="OverlayScroll"
          width={400}
          height={300}
          rowsCount={rowResults.length}
          rowHeight={50}
          rowRenderer={this.getOverlayItem}
          noRowsRenderer={this.noRowsRenderer}
        />
      );
    }

    return (
      <div>
        <div className="search-input-wrapper">
          <input type="text" className="search-input" placeholder="Search..." onChange={this.onSearch}
                 defaultValue={this.state.search} ref="search" autoFocus/>
          <i className="fa fa-search"></i>
        </div>
        {listDisplay}
      </div>
    );
  }

});

module.exports = LinkOverlay;
