var React = require('react');
var AmpersandMixin = require('ampersand-react-mixin');
var _ = require('lodash');
var OverlayHeadRowIdentificator = require('../../overlay/OverlayHeadRowIdentificator.jsx');
var RowConcatHelper = require('../../../helpers/RowConcatHelper.js');
var ActionCreator = require('../../../actions/ActionCreator');

var LinkOverlay = React.createClass({
  mixins : [AmpersandMixin],

  //We want to abort async server requests
  xhrObjects : [],

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
    self.xhrObjects.push(toTable.columns.fetch({
      success : function () {
        self.xhrObjects.push(toTable.rows.fetch({
          success : function () {
            self.setState({
              rowResults : toTable.rows,
              loading : false
            });
          },
          error : function (err) {
            console.log('error fetching rows', err);
          }
        }));
      },
      error : function (err) {
        console.log("error fetching columns", err);
      }
    }));
  },

  componentWillUnmount : function () {
    this.xhrObjects.forEach(function (xhr) {
      xhr.abort();
    });
  },

  onSearch : function (event) {
    var search = this.refs.search.value;
    this.setState({
      search : search
    });
  },

  addLinkValue : function (isLinked, row, rowCellIdValue) {
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

  },

  closeOverlay : function () {
    ActionCreator.closeOverlay();
  },

  stringHasValue : function (stringToCheck) {
    return (stringToCheck && stringToCheck.trim() !== "");
  },

  renderOverlay : function () {
    var self = this;
    var listItems = null;
    var cell = this.props.cell;
    var toColumn = self.props.cell.column.toColumn;
    var currentCellValue = cell ? cell.value : null;
    var toTableId = this.props.cell.column.toTable;
    var toTable = this.props.cell.tables.get(toTableId);
    var toTableColumns = toTable.columns;
    var toIdColumnIndex = toTableColumns.indexOf(toTableColumns.get(toColumn.id)); //This is the index of the identifier / concat column

    //check for empty obj or map fails
    if (!_.isEmpty(this.state.rowResults)) {

      listItems = (
        <ul>
          {this.state.rowResults.map(function (row) {

            var rowConcatString;
            var isLinked = !!_.find(currentCellValue, function (link) {
              return link.id === row.id;
              });
            var rowCellIdValue = row.values[toIdColumnIndex];
            rowConcatString = RowConcatHelper.getRowConcatStringWithFallback(rowCellIdValue, toColumn, self.props.langtag);

            //Search filter
            if (_.isString(rowConcatString) && self.state.search !== null && rowConcatString.toLowerCase().indexOf(self.state.search.trim().toLocaleLowerCase()) > -1) {
              if(rowConcatString && rowConcatString !== ""){
                return <li key={row.id} className={isLinked ? 'isLinked' : ''}
                           onClick={self.addLinkValue.bind(self, isLinked, row, rowCellIdValue)}>{rowConcatString}</li>;
                }else{
                return null;
                }
              }

            })}

        </ul>
      );

    } else {
      listItems = "No data in table '" + self.props.cell.column.name + "'";
    }

    return listItems;
  },

  render : function () {
    var listDisplay;

    if (this.state.loading) {
      listDisplay = "Loading...";
    } else {
      listDisplay = this.renderOverlay();
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
