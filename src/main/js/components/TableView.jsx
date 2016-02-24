var React = require('react');
var AmpersandMixin = require('ampersand-react-mixin');
var Dispatcher = require('../dispatcher/Dispatcher');
var Table = require('./Table.jsx');
var LanguageSwitcher = require('./header/LanguageSwitcher.jsx');
var TableSwitcher = require('./header/TableSwitcher.jsx');
var ActionTypes = require('../constants/TableauxConstants').ActionTypes;
var ActionCreator = require('../actions/ActionCreator');
var Tables = require('../models/Tables');
var FilteredSubcollection = require('ampersand-filtered-subcollection');

import TableauxConstants from '../constants/TableauxConstants';
import FilterButton from './header/filter/FilterButton.jsx';
import NavigationList from './header/NavigationList.jsx';
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
    ActionCreator.spinnerOn();
    //We need to fetch columns first, since rows has Cells that depend on the column model
    currentTable.columns.fetch({
      reset : true,
      success : function () {
        currentTable.rows.fetch({
          reset : true,
          success : function () {
            console.log("table columns & rows fetched successfully.");
            ActionCreator.spinnerOff();
            self.setState({
              initialLoading : false,
              rowsCollection : currentTable.rows,
              currentTableId : tableId
            });
          }
        });
      }
    });
  },

  componentWillUnmount : function () {
    Dispatcher.off(ActionTypes.CLEANUP_TABLE_DONE, this.doSwitchTable);
    Dispatcher.off(ActionTypes.CHANGE_FILTER, this.changeFilter);
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

  changeFilter : function (rowsFilter) {
    var filterValue = rowsFilter.filterValue;
    var filterColumnId = rowsFilter.filterColumnId;
    var sortColumnId = rowsFilter.sortColumnId;
    var sortValue = rowsFilter.sortValue;
    var currentTable = this.getCurrentTable();
    var rowsCollection;
    var allEmpty = _.isEmpty(filterValue) && _.isEmpty(filterColumnId) && _.isEmpty(sortColumnId) && _.isEmpty(sortValue);

    if (allEmpty) {
      rowsCollection = currentTable.rows;
      rowsFilter = null;
    } else {
      rowsCollection = this.getFilteredRows(rowsFilter);
    }

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
    var sortValue = rowsFilter.sortValue;
    var currentTable = this.getCurrentTable();
    var columnsOfTable = currentTable.columns;
    var filterColumnIndex = filterColumnId ? columnsOfTable.indexOf(columnsOfTable.get(filterColumnId)) : null;
    var sortColumnIndex = sortColumnId ? columnsOfTable.indexOf(columnsOfTable.get(sortColumnId)) : null;
    var allRows = currentTable.rows;
    var toFilterValue = filterValue.toLowerCase().trim();
    var self = this;

    var containsValue = function (cellValue, filterValue) {
      return (cellValue.trim().toLowerCase().indexOf(filterValue) > -1);
    };

    var getCellValueAsString = function (cell) {
      var value;
      if (cell.isMultiLanguage) {
        value = cell.value[self.props.langtag];
      } else {
        value = cell.value;
      }
      return value ? value.toString() : "";
    };

    if (_.isEmpty(toFilterValue)) {
      return allRows;
    }

    var filteredRows = new FilteredSubcollection(allRows, {
      filter : function (model) {
        if (!filterColumnIndex || _.isEmpty(filterValue)) {
          return true;
        }
        var targetCell = model.cells.at(filterColumnIndex);
        var firstCell = model.cells.at(0);

        if (firstCell.kind === ColumnKinds.concat) {
          var concatValue = firstCell.rowConcatString(self.props.langtag).toLowerCase().trim();
          //Always return empty concat rows. allows to add new rows while filtered
          if (_.isEmpty(concatValue)) {
            return true;
          }
        }

        if (targetCell.kind === ColumnKinds.concat) {
          var concatValue = targetCell.rowConcatString(self.props.langtag).toLowerCase().trim();
          return containsValue(concatValue, toFilterValue);
        } else if (targetCell.kind === ColumnKinds.shorttext
          || targetCell.kind === ColumnKinds.richtext
          || targetCell.kind === ColumnKinds.numeric) {
          return containsValue(getCellValueAsString(targetCell), toFilterValue);
        }
        else return false;
      },

      comparator : function (model) {
        //default
        if (!sortColumnIndex) {
          return model.id;
        } else {
          return getCellValueAsString(model.cells.at(sortColumnIndex));
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
      return <div className="spinner">Loading</div>;
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
            <NavigationList langtag={this.props.langtag}/>
            <TableSwitcher langtag={this.props.langtag}
                           tableName={tableName}
                           currentTableId={self.state.currentTableId}
                           tables={tables}/>
            <FilterButton langtag={this.props.langtag} table={currentTable} currentFilter={null}/>
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