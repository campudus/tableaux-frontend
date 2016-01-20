var React = require('react');
var AmpersandMixin = require('ampersand-react-mixin');
var _ = require('lodash');
var OverlayHeadRowIdentificator = require('../../overlay/OverlayHeadRowIdentificator.jsx');
var Dispatcher = require('../../../dispatcher/Dispatcher');
var RowIdentifier = require('../../helper/RowIdentifier');
var App = require('ampersand-app');

var LinkOverlay = React.createClass({
  mixins : [AmpersandMixin],

  getInitialState : function () {
    return {
      search : "",
      rowResults : {}
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
    toTable.columns.fetch({
      success : function () {
        toTable.rows.fetch({
          success : function () {
            console.log("success fetching table rows: ", toTable.rows);
            self.setState({rowResults : toTable.rows});
          },
          error : function (err) {
            console.error('error fetching rows', err);
          }
        });
      },
      error : function (err) {
        console.error("error fetching columns", err);
      }
    });

  },

  onSearch : function (event) {
    var search = this.refs.search.value;
    this.setState({
      search : search
    });
  },

  addLinkValue : function (isLinked, row) {
    var cell = this.props.cell;
    var link = {
      id : row.id,
      value : "FIXME" // row.values[0] //TODO: API needs to give us the first column when linking to another table
    };

    return function () {
      console.log("addLinkValue click. cell:", cell, "row:", row);
      var links = _.clone(cell.value);

      if (isLinked) {
        _.remove(links, function (linked) {
          return row.id === linked.id;
        });
      } else {
        links.push(link);
      }

      console.log("trigger", cell.changeCellEvent);
      Dispatcher.trigger(cell.changeCellEvent, {newValue : links});
    };
  },

  closeOverlay : function () {
    Dispatcher.trigger('close-overlay');
  },

  renderOverlay : function () {
    var self = this;
    var listItems = null;
    var cell = this.props.cell;

    //check for empty obj or map fails
    if (!_.isEmpty(this.state.rowResults)) {

      console.log("RowResults:", this.state.rowResults);

      listItems = (
          <ul>
            {this.state.rowResults.map(function (row) {

                //Get identifier string of row
                var rowIdValue = RowIdentifier.getRowIdentifierByRow(row, self.props.langtag);
                var currentCellValue = cell ? cell.value : null;
                var isLinked = !!_.find(currentCellValue, function (link) {
                    return link.id === row.id;
                    });

                //Link Value is empty find default language or don't display
                if((self.props.langtag != App.defaultLangtag) && (!rowIdValue || rowIdValue === "")){
                    rowIdValue = RowIdentifier.getRowIdentifierByRow(row, App.defaultLangtag);

                    if(rowIdValue && rowIdValue != ""){
                        rowIdValue += " (" + App.defaultLangtag  + ")";
                        }
                    }

                if (_.isString(rowIdValue) && self.state.search !== null && rowIdValue.toLowerCase().indexOf(self.state.search.trim().toLocaleLowerCase()) > -1) {
                    if(rowIdValue && rowIdValue !== ""){
                        return <li key={row.id} className={isLinked ? 'isLinked' : ''}
                                   onClick={self.addLinkValue(isLinked, row)}>{rowIdValue}</li>;
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

    return (
        <div>
          <div className="search-input-wrapper">
            <input type="text" className="search-input" placeholder="Search..." onChange={this.onSearch}
                   defaultValue={this.state.search} ref="search"/>
            <i className="fa fa-search"></i>
          </div>
          {listItems}
        </div>
    );
  },

  render : function () {
    return this.renderOverlay();
  }

});

module.exports = LinkOverlay;
