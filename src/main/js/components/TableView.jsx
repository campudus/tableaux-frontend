var React = require('react');
var AmpersandMixin = require('ampersand-react-mixin');
var Dispatcher = require('../dispatcher/Dispatcher');
var Table = require('./table/Table.jsx');
var LanguageSwitcher = require('./header/LanguageSwitcher.jsx');
var TableSwitcher = require('./header/tableSwitcher/TableSwitcher.jsx');
var ActionCreator = require('../actions/ActionCreator');
var Tables = require('../models/Tables');
var FilteredSubcollection = require('ampersand-filtered-subcollection');
var RowConcatHelper = require('../helpers/RowConcatHelper');
import * as AccessControl from "../helpers/accessManagementHelper";
import * as _ from "lodash";
import * as f from "lodash/fp";
import TableauxConstants, {SortValues, ActionTypes, FilterModes} from "../constants/TableauxConstants";
import Filter from "./header/filter/Filter.jsx";
import Navigation from "./header/Navigation.jsx";
import PageTitle from "./header/PageTitle.jsx";
import Spinner from "./header/Spinner.jsx";
import TableSettings from "./header/tableSettings/TableSettings";
import searchFunctions from "../helpers/searchFunctions";
import ColumnFilter from "./header/ColumnFilter";
import {either} from "../helpers/monads";

var ColumnKinds = TableauxConstants.ColumnKinds;

class TableView extends React.Component {
//  mixins: [AmpersandMixin],

  constructor(props) {
    super(props);
    this.nextTableId = null;
    this.state = {
      initialLoading: true,
      currentTableId: this.props.tableId,
      rowsCollection: null,
      rowsFilter: null
    }
  };

  // tries to extract [tableId][name] from views in memory, falls back to "first ten visible"
  loadView = (tableId, name = "default") => {
    const table = this.tables.get(tableId);
    const DEFAULT_VISIBLE_COLUMS = 10;
    if (!table) {
      console.log("Could not access table ID", tableId, "of", this.tables);
      return;
    }

    const cols = table.columns.models;

    const savedView = either(localStorage)
      .map(f.prop(["tableViews", tableId, name]))
      .map(JSON.parse)
      .getOrElse(null);
    if (savedView) {
      f.map(col => col.visibility = savedView[col.id]);
    } else {
      cols.map(x => x.visible = false);
      f.map(x => x.visible = true, f.take(DEFAULT_VISIBLE_COLUMS, cols));
    }
  };

  calcVisibilityArray = () =>  {
    const table = this.getCurrentTable();
    const cols = table.columns.models;
    return cols.reduce((a,b) => f.merge({[b.id]: b.visible}, a), {});
  };

  // receives an object of {[tableId]: {[viewname]: [bool, bool,...]}}
  saveView = (name = "default") => {
    if (!localStorage) {
      return;
    }

    const {currentTableId} = this.state;
    const cols = this.tables.get(currentTableId).columns.models;
    const view = this.calcVisibilityArray();
    const savedViews = either(localStorage)
      .map(f.prop(["tableViews"]))
      .map(JSON.parse)
      .getOrElse({});
    _.set([currentTableId,name], view, savedViews)
  };

  componentWillMount = () => {
    Dispatcher.on(ActionTypes.CLEANUP_TABLE_DONE, this.doSwitchTable);
    Dispatcher.on(ActionTypes.CHANGE_FILTER, this.changeFilter);
    Dispatcher.on(ActionTypes.CLEAR_FILTER, this.clearFilter);
    Dispatcher.on(ActionTypes.SET_COLUMNS_VISIBILITY, this.setColumnsVisibility, this);
  };

  componentDidMount = () => {
    ActionCreator.spinnerOn();

    // fetch all tables
    if (!this.tables) {
      this.tables = new Tables();
      this.tables.fetch({
        success: (collection) => {
          if (this.props.tableId === null) {
            ActionCreator.switchTable(collection.at(0).getId(), this.props.langtag);
          } else {
            this.fetchTable(this.props.tableId);
          }
        }
      });
    }
  };

  fetchTable = (tableId) => {
    const currentTable = this.tables.get(tableId);

    //We need to fetch columns first, since rows has Cells that depend on the column model
    const fetchColumns = table => {
      return new Promise((resolve, reject) => {
        table.columns.fetch({
          reset: true,
          success: () => {
            this.loadView(table.id);
            resolve({ // return information about first page to be fetched
              table: table,
              page: 1
            });
          },
          error: e => {
            ActionCreator.spinnerOff();
            reject("Error fetching table columns:" + JSON.stringify(e));
          }
        });
      });
    };

    const fetchPages = ({table, page}) => {
      const total = table.rows.pageCount();
      if (page > table.rows.pageCount()) { // we're done
        console.log("Done fetching", total, "pages");
        ActionCreator.spinnerOff();
        return;
      }
      new Promise((resolve, reject) => {
        table.rows.fetchPage(page,
          {
            reset: page === 1,
            success: () => {
              console.log("Table page number", page ,((page > 1) ? "of " + total + " " : "") + "successfully fetched");

              if (page === 1) {
                this.setState({
                  initialLoading: false,
                  rowsCollection: table.rows,
                  currentTableId: tableId,
                  rowsFilter: null
                });
              }

              resolve({ // return information about next page to be fetched
                table: table,
                page: page + 1
              });
            },
            error: e => {
              ActionCreator.spinnerOff();
              reject("Error fetching page number " + page + ":" + JSON.stringify(e));
            }
          });
      }).then(fetchPages); // recur with page number increased
    };

    //spinner for the table switcher. Not the initial loading! Initial loading spinner is globally and centered
    //in the middle, and gets displayed only on the first startup
    ActionCreator.spinnerOn();
    fetchColumns(currentTable).then(fetchPages);
  };

  componentWillUnmount = () => {
    Dispatcher.off(ActionTypes.CLEANUP_TABLE_DONE, this.doSwitchTable);
    Dispatcher.off(ActionTypes.CHANGE_FILTER, this.changeFilter);
    Dispatcher.off(ActionTypes.CLEAR_FILTER, this.clearFilter);
    Dispatcher.off(ActionTypes.SET_COLUMNS_VISIBILITY, this.setColumnsVisibility, this);
  };

  componentWillReceiveProps = (nextProps) => {
    if (nextProps.tableId !== this.props.tableId) {
      var oldTable = this.tables.get(this.state.currentTableId);
      this.nextTableId = nextProps.tableId;
      if (oldTable) {
        ActionCreator.cleanupTable(oldTable);
      } else {
        this.doSwitchTable();
      }
    }
  };

  //Set visibility of all columns in <coll> to <val>
  setColumnsVisibility = ({val, coll, cb}) => {
    const columns = this.tables.get(this.state.currentTableId).columns.models;
    columns
      .filter(x => f.contains(x.id, coll))
      .map(x => x.visible = val)
    this.forceUpdate();
    this.saveView();
    if (cb) {
      cb();
    }
  };

  setDocumentTitleToTableName = () => {
    const currentTable = this.tables.get(this.state.currentTableId);

    if (currentTable) {
      const tableDisplayNameObj = this.tables.get(this.state.currentTableId).displayName;
      const tableDisplayName = tableDisplayNameObj[this.props.langtag] || tableDisplayNameObj[TableauxConstants.FallbackLanguage];
      document.title = tableDisplayName
        ? tableDisplayName + " | " + TableauxConstants.PageTitle
        : TableauxConstants.PageTitle;
    }
  };

  componentDidUpdate = () => {
    this.setDocumentTitleToTableName();
  };

  clearFilter = () => {
    this.setState({
      rowsCollection: this.getCurrentTable().rows,
      rowsFilter: null
    });
  };

  changeFilter = (rowsFilter) => {
    const {filterValue, filterColumnId, sortValue, sortColumnId} = rowsFilter;

    const isFilterEmpty = _.isEmpty(filterValue) && !_.isFinite(filterColumnId) && !_.isFinite(sortColumnId) && _.isEmpty(
        sortValue);

    let rowsCollection;
    if (isFilterEmpty) {
      rowsFilter = null;
      rowsCollection = this.getCurrentTable().rows;
    } else {
      rowsCollection = this.getFilteredRows(rowsFilter);
    }

    this.setState({
      rowsCollection: rowsCollection,
      rowsFilter: rowsFilter
    });
  };

  getCurrentTable = () => {
    return this.tables.get(this.state.currentTableId);
  };

  getFilteredRows = (rowsFilter) => {
    const filterColumnId = rowsFilter.filterColumnId;
    const filterValue = rowsFilter.filterValue;
    const filterMode = rowsFilter.filterMode;
    const sortColumnId = rowsFilter.sortColumnId;
    const sortValue = rowsFilter.sortValue;

    const currentTable = this.getCurrentTable();
    const columnsOfTable = currentTable.columns;

    const filterColumnIndex = _.isFinite(filterColumnId)
      ? columnsOfTable.indexOf(columnsOfTable.get(filterColumnId))
      : -1;
    const sortColumnIndex = _.isFinite(sortColumnId) ? columnsOfTable.indexOf(columnsOfTable.get(sortColumnId)) : -1;

    const allRows = currentTable.rows;
    const toFilterValue = filterValue.toLowerCase().trim();

    const langtag = this.props.langtag;

    const getSortableCellValue = function (cell) {
      let sortableValue;

      if (cell.isLink) {
        const linkValues = _.map(cell.linkStringLanguages, (linkElement) => {
          return linkElement[langtag] ? linkElement[langtag] : "";
        });

        sortableValue = _.join(linkValues, ":");
      } else if (cell.kind === ColumnKinds.concat) {
        // not really nice I think the Cell should replace
        // an empty concat value with "- NO VALUE -" and not
        // the model itself!
        const temp = cell.rowConcatString(langtag);
        sortableValue = temp === RowConcatHelper.NOVALUE ? "" : temp;
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

    if (_.isEmpty(toFilterValue) && typeof sortColumnId === 'undefined') {
      return allRows;
    }

    return new FilteredSubcollection(allRows, {
      filter: (row) => {
        if (filterColumnIndex <= -1 || (_.isEmpty(filterValue))) {
          // no or invalid column found OR no filter value
          return true;
        }

        const firstCell = row.cells.at(0);
        const firstCellValue = getSortableCellValue(firstCell);

        // Always return true for rows with empty first value.
        // This should allow to add new rows while filtered.
        // _.isEmpty(123) returns TRUE, so we check for number (int & float)
        if (_.isEmpty(firstCellValue) && !_.isFinite(firstCellValue)) {
          return true;
        }

        const targetCell = row.cells.at(filterColumnIndex);
        const searchFunction = searchFunctions[filterMode];

        if (targetCell.kind === ColumnKinds.shorttext
          || targetCell.kind === ColumnKinds.richtext
          || targetCell.kind === ColumnKinds.numeric
          || targetCell.kind === ColumnKinds.text
          || targetCell.kind === ColumnKinds.link
          || targetCell.kind === ColumnKinds.concat) {
          return searchFunction(toFilterValue, getSortableCellValue(targetCell))
        } else {
          // column type not support for filtering
          return false;
        }
      },

      comparator: (rowOne, rowTwo) => {
        // swap gt and lt to support ASC and DESC
        // gt = in case rowOne > rowTwo
        // lt = in case rowOne < rowTwo
        const gt = sortValue === SortValues.ASC ? +1 : -1;
        const lt = sortValue === SortValues.ASC ? -1 : +1;

        const compareRowIds = () => {
          return rowOne.id === rowTwo.id ? 0 : (rowOne.id > rowTwo.id ? gt : lt);
        };

        if (sortColumnIndex <= -1) {
          if (typeof rowTwo === 'undefined') {
            // strange special case if row was added
            return rowOne.id;
          }

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
  };

  doSwitchTable = () => {
    if (this.nextTableId) {
      console.log("doSwitchTable with id:", this.nextTableId);
      this.fetchTable(this.nextTableId);
      this.loadView(this.nextTableId);
    }
  };

  onLanguageSwitch = (newLangtag) => {
    ActionCreator.switchLanguage(newLangtag);
  };

  render = () => {
    if (this.state.initialLoading) {
      return <div className="initial-loader"><Spinner isLoading={true} /></div>;
    } else {
      const visibility = this.calcVisibilityArray();
      var tables = this.tables;
      var rowsCollection = this.state.rowsCollection;
      var currentTable = this.getCurrentTable();

      var table = '';
      if (this.state.currentTableId) {
        if (typeof tables.get(this.state.currentTableId) !== 'undefined') {
          table = <Table key={this.state.currentTableId} table={currentTable}
                         langtag={this.props.langtag} rows={rowsCollection} overlayOpen={this.props.overlayOpen}
                         visibility={visibility}
          />;
        } else {
          //TODO show error to user
          console.error("No table found with id " + this.state.currentTableId);
        }
      }

      return (
        <div>
          <header>
            <Navigation langtag={this.props.langtag} />
            <TableSwitcher langtag={this.props.langtag}
                           currentTable={currentTable}
                           tables={tables} />
            {(AccessControl.isUserAdmin())
              ? <TableSettings langtag={this.props.langtag} table={currentTable} />
              : null}
            <Filter langtag={this.props.langtag} table={currentTable} currentFilter={this.state.rowsFilter} />
            <ColumnFilter langtag={this.props.langtag}
                          columns={currentTable.columns}
            />
            <LanguageSwitcher langtag={this.props.langtag} onChange={this.onLanguageSwitch} />
            <PageTitle titleKey="pageTitle.tables" />
            <Spinner />
          </header>
          <div className="wrapper">
            {table}
          </div>
        </div>
      );
    }
  }
};

TableView.propTypes = {
  langtag: React.PropTypes.string.isRequired,
  overlayOpen: React.PropTypes.bool.isRequired,
  tableId: React.PropTypes.number
};

export default TableView;