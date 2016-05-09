var React = require('react');
var AmpersandMixin = require('ampersand-react-mixin');
var Dispatcher = require('../dispatcher/Dispatcher');
var Table = require('./table/Table.jsx');
var LanguageSwitcher = require('./header/LanguageSwitcher.jsx');
var TableSwitcher = require('./header/TableSwitcher.jsx');
var ActionTypes = require('../constants/TableauxConstants').ActionTypes;
var ActionCreator = require('../actions/ActionCreator');
var Tables = require('../models/Tables');
var FilteredSubcollection = require('ampersand-filtered-subcollection');

import _ from 'lodash';
import TableauxConstants from '../constants/TableauxConstants';
import Filter from './header/filter/Filter.jsx';
import Navigation from './header/Navigation.jsx';
import PageTitle from './header/PageTitle.jsx';
import Spinner from './header/Spinner.jsx';

var ColumnKinds = TableauxConstants.ColumnKinds;

var TableView = React.createClass({
  mixins : [AmpersandMixin],

  propTypes : {
    langtag : React.PropTypes.string.isRequired,
    overlayOpen : React.PropTypes.bool.isRequired,
    tableId : React.PropTypes.number
  },

  nextTableId : null,
  tables : null,

  getInitialState : function () {
    return {
      initialLoading : true,
      currentTableId : this.props.tableId,
      rowsCollection : null,
      rowsFilter : null
    }
  },

  componentWillMount : function () {
    var self = this;

    Dispatcher.on(ActionTypes.CLEANUP_TABLE_DONE, this.doSwitchTable);
    Dispatcher.on(ActionTypes.CHANGE_FILTER, this.changeFilter);
    Dispatcher.on(ActionTypes.CLEAR_FILTER, this.clearFilter);

    ActionCreator.spinnerOn();

    //fetch all tables
    if (!self.tables) {
      self.tables = new Tables();
      self.tables.fetch({
        success : function (collection) {
          if (self.props.tableId === null) {
            ActionCreator.switchTable(collection.at(0).getId(), self.props.langtag);
          } else {
            self.fetchTable(self.props.tableId);
          }
        }
      });
    }

  },

  fetchTable : function (tableId) {
    var self = this;
    var currentTable = self.tables.get(tableId);
    //spinner for the table switcher. Not the initial loading! Initial loading spinner is globally and centered
    //in the middle, and gets displayed only on the first startup
    ActionCreator.spinnerOn();
    //We need to fetch columns first, since rows has Cells that depend on the column model
    currentTable.columns.fetch({
      reset : true,

      //success for initial rows request
      success : function () {
        currentTable.rows.fetchInitial({
          reset : true,
          success : function () {
            console.log("table columns & rows initial fetched successfully.");
            self.setState({
              initialLoading : false,
              rowsCollection : currentTable.rows,
              currentTableId : tableId,
              rowsFilter : null
            });
            //Spinner for the second (tail fetch) call
            ActionCreator.spinnerOn();
            currentTable.rows.fetchTail({

              //success for rest rows request (without initial limit)
              success : function () {
                console.log("rows fetched the rest");
                ActionCreator.spinnerOff();
              },

              //error for rows tail request
              error : function (error) {
                console.error("Error fetching rows after initial request. Error from server:", error);
              }

            });
          },

          //error for initial rows request
          error : function (error) {
            console.error("Error fetching initial rows. Error from server:", error);
          }
        });
      }
    });
  },

  componentWillUnmount : function () {
    Dispatcher.off(ActionTypes.CLEANUP_TABLE_DONE, this.doSwitchTable);
    Dispatcher.off(ActionTypes.CHANGE_FILTER, this.changeFilter);
    Dispatcher.off(ActionTypes.CLEAR_FILTER, this.clearFilter);
  },

  componentWillReceiveProps : function (nextProps) {
    if (nextProps.tableId !== this.props.tableId) {
      var oldTable = this.tables.get(this.state.currentTableId);
      this.nextTableId = nextProps.tableId;
      if (oldTable) {
        ActionCreator.cleanupTable(oldTable);
      } else {
        this.doSwitchTable();
      }
    }
  },

  shouldComponentUpdate : function (nextProps, nextState) {

    //FIXME: PureRenderer!
    return true;

    var shouldRenderPropUpdate = nextProps.langtag !== this.props.langtag || nextProps.overlayOpen !== this.props.overlayOpen;
    var shouldRenderStateUpdate = nextState.initialLoading !== this.state.initialLoading || nextState.currentTableId !== this.state.currentTableId;
    return shouldRenderPropUpdate || shouldRenderStateUpdate;
  },

  clearFilter : function () {
    this.setState({
      rowsCollection : this.getCurrentTable().rows,
      rowsFilter : null
    });
  },

  changeFilter : function (rowsFilter) {
    var filterValue = rowsFilter.filterValue;
    var filterColumnId = rowsFilter.filterColumnId;
    var sortColumnId = rowsFilter.sortColumnId;
    var sortValue = rowsFilter.sortValue;
    var currentTable = this.getCurrentTable();
    var rowsCollection;
    var allEmpty = _.isEmpty(filterValue) && !_.isFinite(filterColumnId) && !_.isFinite(sortColumnId) && _.isEmpty(sortValue);


    if (allEmpty) {
      rowsCollection = currentTable.rows;
      rowsFilter = null;
    } else {
      rowsCollection = this.getFilteredRows(rowsFilter);
    }

    console.log("setting rowsFilter to state:", rowsFilter);
    this.setState({
      rowsCollection : rowsCollection,
      rowsFilter : rowsFilter
    });
  },

  getCurrentTable : function () {
    return this.tables.get(this.state.currentTableId);
  },

  getFilteredRows : function (rowsFilter) {
    var filterValue = rowsFilter.filterValue;
    var filterColumnId = rowsFilter.filterColumnId;
    var sortColumnId = rowsFilter.sortColumnId;
    var currentTable = this.getCurrentTable();
    var columnsOfTable = currentTable.columns;
    var filterColumnIndex = _.isFinite(filterColumnId) ? columnsOfTable.indexOf(columnsOfTable.get(filterColumnId)) : null;
    var sortColumnIndex = _.isFinite(sortColumnId) ? columnsOfTable.indexOf(columnsOfTable.get(sortColumnId)) : null;
    var allRows = currentTable.rows;
    var toFilterValue = filterValue.toLowerCase().trim();
    var self = this;
    var langtag = this.props.langtag;

    var containsValue = function (cellValue, filterValue) {
      return _.every(_.words(filterValue), function (word) {
        return cellValue.toString().trim().toLowerCase().indexOf(word) > -1;
      });
    };

    var getCellValue = function (cell) {
      var value;

      if (cell.isLink) {
        _.forEach(cell.linkStringLanguages, (linkElement)=> {
          value += linkElement[langtag] + " ";
        });
      } else if (cell.isMultiLanguage) {
        value = cell.value[self.props.langtag];
      } else {
        value = cell.value;
      }

      if (value) {
        if (cell.kind === ColumnKinds.numeric) {
          value = parseInt(value);
        } else {
          value = value.toString().trim();
        }
      } else {
        value = "";
      }

      return value;
    };

    if (_.isEmpty(toFilterValue) && !sortColumnId) {
      return allRows;
    }

    var filteredRows = new FilteredSubcollection(allRows, {
      filter : function (model) {
        if (!_.isFinite(filterColumnIndex) || _.isEmpty(filterValue)) {
          return true;
        }
        var targetCell = model.cells.at(filterColumnIndex);
        var firstCell = model.cells.at(0);

        if (firstCell.kind === ColumnKinds.concat) {
          var concatValue = firstCell.rowConcatString(langtag).toLowerCase().trim();
          //Always return empty concat rows. allows to add new rows while filtered
          if (_.isEmpty(concatValue)) {
            return true;
          }
        } else {
          //First cell is not concat but probably text, shorttext, etc.
          var firstCellValue = getCellValue(firstCell);
          if (_.isEmpty(firstCellValue)) {
            return true;
          }
        }

        if (targetCell.kind === ColumnKinds.concat) {
          var concatValue = targetCell.rowConcatString(langtag).toLowerCase().trim();
          return containsValue(concatValue, toFilterValue);
        } else if (targetCell.kind === ColumnKinds.shorttext
          || targetCell.kind === ColumnKinds.richtext
          || targetCell.kind === ColumnKinds.numeric
          || targetCell.kind === ColumnKinds.text
          || targetCell.kind === ColumnKinds.link) {
          return containsValue(getCellValue(targetCell), toFilterValue);
        } else return false;
      },

      //TODO: There's a ugly situation when sorted by year and new rows are getting added. In the future we probably need to implement our own comparator
      comparator : function (model) {
        //default
        if (!_.isFinite(sortColumnIndex)) {
          return model.id;
        } else {
          let cellValue = getCellValue(model.cells.at(sortColumnIndex));
          if (_.isNumber(cellValue)) {
            return cellValue;
          } else {
            //we want the cell value to be lowercase to prevent a is behind Z
            return _.isString(cellValue) && cellValue !== "" ? cellValue.toLowerCase() : null; //null forces empty fields to the bottom
          }
        }
      }

    });

    return filteredRows;
  },

  doSwitchTable : function () {
    if (this.nextTableId) {
      console.log("doSwitchTable with id:", this.nextTableId);
      this.fetchTable(this.nextTableId);
    }
  },

  onLanguageSwitch : function (newLangtag) {
    ActionCreator.switchLanguage(newLangtag);
  },

  render : function () {
    if (this.state.initialLoading) {
      return <div className="initial-loader"><Spinner isLoading={true}/></div>;
    } else {
      var self = this;
      var tables = this.tables;
      var rowsCollection = this.state.rowsCollection;
      var currentTable = this.getCurrentTable();

      var table = '';
      var tableName = '';
      if (this.state.currentTableId) {
        if (typeof tables.get(this.state.currentTableId) !== 'undefined') {
          table = <Table key={this.state.currentTableId} table={currentTable}
                         langtag={this.props.langtag} rows={rowsCollection} overlayOpen={this.props.overlayOpen}/>;
          tableName = currentTable.name;
        } else {
          //TODO show error to user
          console.error("No table found with id " + this.state.currentTableId);
        }
      }

      return (
        <div>
          <header>
            <Navigation langtag={this.props.langtag}/>
            <TableSwitcher langtag={this.props.langtag}
                           tableName={tableName}
                           currentTableId={self.state.currentTableId}
                           tables={tables}/>
            <Filter langtag={this.props.langtag} table={currentTable} currentFilter={this.state.rowsFilter}/>
            <LanguageSwitcher langtag={this.props.langtag} onChange={this.onLanguageSwitch}/>
            <PageTitle titleKey="pageTitle.tables"/>
            <Spinner />
          </header>
          <div className="wrapper">
            {table}
          </div>
        </div>
      );
    }
  }
});

module.exports = TableView;