var React = require('react');
var AmpersandMixin = require('ampersand-react-mixin');
var Dispatcher = require('../dispatcher/Dispatcher');
var Table = require('./table/Table.jsx');
var LanguageSwitcher = require('./header/LanguageSwitcher.jsx');
var TableSwitcher = require('./header/tableSwitcher/TableSwitcher.jsx');
var ActionCreator = require('../actions/ActionCreator');
var Tables = require('../models/Tables');
var FilteredSubcollection = require('ampersand-filtered-subcollection');

import * as _ from 'lodash';
import TableauxConstants, {SortValues, ActionTypes} from '../constants/TableauxConstants';
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

            self.setDocumentTitleToTableName();

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

  setDocumentTitleToTableName : function () {
    const tableDisplayNameObj = this.tables.get(this.state.currentTableId).displayName;
    const tableDisplayName = tableDisplayNameObj[this.props.langtag] || tableDisplayNameObj[TableauxConstants.FallbackLanguage];
    document.title = tableDisplayName ? tableDisplayName + " | " + TableauxConstants.PageTitle : TableauxConstants.PageTitle;
  },

  componentDidUpdate : function (prevProps) {
    if (prevProps.langtag !== this.props.langtag) {
      this.setDocumentTitleToTableName();
    }
  },

  clearFilter : function () {
    this.setState({
      rowsCollection : this.getCurrentTable().rows,
      rowsFilter : null
    });
  },

  changeFilter : function (rowsFilter) {
    const {filterValue, filterColumnId, sortValue, sortColumnId} = rowsFilter;

    const isFilterEmpty = _.isEmpty(filterValue) && !_.isFinite(filterColumnId) && !_.isFinite(sortColumnId) && _.isEmpty(sortValue);

    let rowsCollection;
    if (isFilterEmpty) {
      rowsFilter = null;
      rowsCollection = this.getCurrentTable().rows;
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
    const filterColumnId = rowsFilter.filterColumnId;
    const filterValue = rowsFilter.filterValue;

    const sortColumnId = rowsFilter.sortColumnId;
    const sortValue = rowsFilter.sortValue;

    const currentTable = this.getCurrentTable();
    const columnsOfTable = currentTable.columns;

    const filterColumnIndex = _.isFinite(filterColumnId) ? columnsOfTable.indexOf(columnsOfTable.get(filterColumnId)) : null;
    const sortColumnIndex = _.isFinite(sortColumnId) ? columnsOfTable.indexOf(columnsOfTable.get(sortColumnId)) : -1;

    const allRows = currentTable.rows;
    const toFilterValue = filterValue.toLowerCase().trim();

    const langtag = this.props.langtag;

    const containsValue = function (cellValue, filterValue) {
      return _.every(_.words(filterValue), function (word) {
        return cellValue.toString().trim().toLowerCase().indexOf(word) > -1;
      });
    };

    const getSortableCellValue = function (cell) {
      let sortableValue;

      if (cell.isLink) {
        const linkValues = _.map(cell.linkStringLanguages, (linkElement) => {
          return linkElement[langtag] ? linkElement[langtag] : "";
        });

        sortableValue = _.join(linkValues, ":");
      } else if (cell.kind === ColumnKinds.concat) {
        sortableValue = cell.rowConcatString(langtag);
      } else if (cell.isMultiLanguage) {
        sortableValue = cell.value[langtag];
      } else {
        sortableValue = cell.value;
      }

      if (sortableValue) {
        if (cell.kind === ColumnKinds.numeric) {
          sortableValue = _.toNumber(sortableValue);
        } else if (cell.kind === ColumnKinds.boolean) {
          sortableValue = !!sortableValue;
        } else {
          sortableValue = sortableValue.toString().trim().toLowerCase();
        }
      } else {
        if (cell.kind === ColumnKinds.boolean) {
          sortableValue = false;
        } else {
          sortableValue = "";
        }
      }

      return sortableValue;
    };

    if (_.isEmpty(toFilterValue) && typeof sortColumnId === 'undefined') {
      return allRows;
    }

    return new FilteredSubcollection(allRows, {
      filter : function (row) {
        if (!_.isFinite(filterColumnIndex) || _.isEmpty(filterValue)) {
          return true;
        }

        const targetCell = row.cells.at(filterColumnIndex);
        const firstCell = row.cells.at(0);

        if (firstCell.kind === ColumnKinds.concat) {
          const concatValue = firstCell.rowConcatString(langtag).toLowerCase().trim();
          //Always return empty concat rows. allows to add new rows while filtered
          if (_.isEmpty(concatValue)) {
            return true;
          }
        } else {
          //First cell is not concat but probably text, shorttext, number, etc.
          const firstCellValue = getSortableCellValue(firstCell);
          //_.isEmpty(123) returns TRUE, so we check for number (int & float)
          if (_.isEmpty(firstCellValue) && !_.isFinite(firstCellValue)) {
            return true;
          }
        }

        if (targetCell.kind === ColumnKinds.concat) {
          const concatValue = targetCell.rowConcatString(langtag).toLowerCase().trim();
          return containsValue(concatValue, toFilterValue);
        } else if (targetCell.kind === ColumnKinds.shorttext
          || targetCell.kind === ColumnKinds.richtext
          || targetCell.kind === ColumnKinds.numeric
          || targetCell.kind === ColumnKinds.text
          || targetCell.kind === ColumnKinds.link) {
          return containsValue(getSortableCellValue(targetCell), toFilterValue);
        } else {
          return false;
        }
      },

      comparator : function (rowOne, rowTwo) {
        // swap gt and lt to support ASC and DESC
        // gt = in case rowOne > rowTwo
        // lt = in case rowOne < rowTwo
        const gt = sortValue === SortValues.ASC ? +1 : -1;
        const lt = sortValue === SortValues.ASC ? -1 : +1;

        const compareRowIds = () => {
          return rowOne.id === rowTwo.id ? 0 : (rowOne.id > rowTwo.id ? gt : lt);
        };

        if (sortColumnIndex <= -1) {
          // Default sort by row id
          return compareRowIds();
        } else {
          const cellValueOne = rowOne && rowOne.cells ? getSortableCellValue(rowOne.cells.at(sortColumnIndex)) : null;
          const cellValueTwo = rowTwo && rowTwo.cells ? getSortableCellValue(rowTwo.cells.at(sortColumnIndex)) : null;

          const isEmptyOne = cellValueOne === null || (typeof cellValueOne === 'string' && _.isEmpty(cellValueOne));
          const isEmptyTwo = cellValueTwo === null || (typeof cellValueTwo === 'string' && _.isEmpty(cellValueTwo));

          if (isEmptyOne && isEmptyTwo) {
            return 0;
          } else if (isEmptyOne) {
            // ensure than in both sorting cases null/emptys are last!
            return sortValue === SortValues.ASC ? gt : lt;
          } else if (isEmptyTwo) {
            // ensure than in both sorting cases null/emptys are last!
            return sortValue === SortValues.ASC ? lt : gt;
          } else {
            // first compare values and if equal than sort by row id
            return _.eq(cellValueOne, cellValueTwo) ? compareRowIds() : (_.gt(cellValueOne, cellValueTwo) ? gt : lt)
          }
        }
      }
    });
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
      var tables = this.tables;
      var rowsCollection = this.state.rowsCollection;
      var currentTable = this.getCurrentTable();

      var table = '';
      if (this.state.currentTableId) {
        if (typeof tables.get(this.state.currentTableId) !== 'undefined') {
          table = <Table key={this.state.currentTableId} table={currentTable}
                         langtag={this.props.langtag} rows={rowsCollection} overlayOpen={this.props.overlayOpen}/>;
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
                           currentTable={currentTable}
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