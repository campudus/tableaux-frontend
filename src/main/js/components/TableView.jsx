import React from "react";
import connectToAmpersand from "../helpers/connectToAmpersand";
import Dispatcher from "../dispatcher/Dispatcher";
import Table from "./table/Table.jsx";
import LanguageSwitcher from "./header/LanguageSwitcher.jsx";
import TableSwitcher from "./header/tableSwitcher/TableSwitcher.jsx";
import ActionCreator from "../actions/ActionCreator";
import Tables from "../models/Tables";
import FilteredSubcollection from "ampersand-filtered-subcollection";
import RowConcatHelper from "../helpers/RowConcatHelper";
import * as AccessControl from "../helpers/accessManagementHelper";
import * as _ from "lodash";
import * as f from "lodash/fp";
import TableauxConstants, {SortValues, ActionTypes, FilterModes, ColumnKinds} from "../constants/TableauxConstants";
import Filter from "./header/filter/Filter.jsx";
import Navigation from "./header/Navigation.jsx";
import PageTitle from "./header/PageTitle.jsx";
import Spinner from "./header/Spinner.jsx";
import TableSettings from "./header/tableSettings/TableSettings";
import searchFunctions from "../helpers/searchFunctions";
import ColumnFilter from "./header/ColumnFilter";
import {either, spy} from "../helpers/monads";
import {PAGE_SIZE, INITIAL_PAGE_SIZE} from "../models/Rows";
import LocationBar from "location-bar";

//hardcode all the stuffs!
const ID_CELL_W = 80;
const CELL_W = 300;
const CELL_H = 46;

@connectToAmpersand
class TableView extends React.Component {

  constructor(props) {
    super(props);
    this.nextTableId = null;
    this.pendingCellGoto = null;
    this.tableFullyLoaded = false;
    this.state = {
      initialLoading: true,
      currentTableId: this.props.tableId,
      rowsCollection: null,
      rowsFilter: null
    }

    const {columnId, rowId} = this.props;
    if (columnId && rowId) {
      this.pendingCellGoto = {
        page: this.estimateCellPage(rowId),
        row: rowId,
        column: columnId
      }
    }

    this.locationBar = new LocationBar();
    this.locationBar.onChange(this.handleUrlChange);
    this.locationBar.start({
      pushState: true,
     // silent: true
    });
  };

  handleUrlChange = url => {
    console.log("handleUrlChange", url)
    const urlExtractor = /([\w]{2}-?[\w]*)\/tables\/([0-9]+)\/columns\/([0-9+])\/rows\/([0-9]+)(\?filter)?/;
    const matchMap = urlExtractor.exec(url);
    if (!matchMap || matchMap.length !== 6) {
      return null;
    }
    const [_, langtag, table, column, row, filter] = matchMap;
    this.gotoCell({
      row: row,
      column: column,
      page: this.estimateCellPage(row),
      ignore: "NO_HISTORY_PUSH"
    });
  }

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
      .map(f.prop(["tableViews"]))
      .map(JSON.parse)
      .map(f.prop([tableId, name]))
      .getOrElse(null);

    if (savedView) {
      cols.map(col => col.visible = savedView[col.id]);
    } else {
      cols.forEach(x => x.visible = false);
      f.map(x => x.visible = true, f.take(DEFAULT_VISIBLE_COLUMS, cols));
    }
  };

  // receives an object of {[tableId]: {[viewname]: [bool, bool,...]}}
  saveView = (name = "default") => {
    if (!localStorage) {
      return;
    }

    const {currentTableId} = this.state;
    const cols = this.tables.get(currentTableId).columns.models;
    const view = cols.reduce((a, b) => f.merge({[b.id]: b.visible}, a), {});
    const savedViews = either(localStorage)
      .map(f.prop(["tableViews"]))
      .map(JSON.parse)
      .getOrElse({});
    localStorage["tableViews"] = JSON.stringify(f.set([currentTableId, name], view, savedViews))
  };

  cellJumpError = msg => {
    ActionCreator.showToast(
      <div id="cell-jump-toast">{msg}</div>,
      7000
    )
  }

  checkGotoCellRequest = (loaded) => {
    if (!this.pendingCellGoto) {
      return;
    }
    const {row, column, page} = this.pendingCellGoto;
    const columns = this.getCurrentTable().columns.models;
    if (f.findIndex(f.matchesProperty("id", column), columns) < 0) {
      this.cellJumpError(`This table has no column ${column}.`);
      this.pendingCellGoto = null;
      return;
    }

    if (loaded >= page || this.tableFullyLoaded) {
      this.gotoCell(this.pendingCellGoto, loaded);
    }
  };

  estimateCellPage = row => 1 + Math.ceil((row - INITIAL_PAGE_SIZE) / PAGE_SIZE);

  gotoCell = ({row, column, page, ignore = false}, nPagesLoaded = 0) => {
    const cellId = `cell-${this.state.currentTableId}-${column}-${row}`;
    const cellClass = `cell-${column}-${row}`;

    // Helper closure
    const focusCell = cell => {
      this.setColumnsVisibility({
        val: true,
        coll: [column]
      });
      const rows = this.getCurrentTable().rows.models;
      const rowIndex = f.findIndex(f.matchesProperty('id', row), rows);
      const columns = this.getCurrentTable().columns.models;
      const visibleColumns = columns.filter(x => x.visible);
      const colIndex = f.findIndex(f.matchesProperty("id", column), visibleColumns);
      const scrollContainer = f.first(document.getElementsByClassName("data-wrapper"));
      const xOffs = ID_CELL_W + (colIndex) * CELL_W - (window.innerWidth - CELL_W) / 2;
      const yOffs = CELL_H * rowIndex - (scrollContainer.getBoundingClientRect().height - CELL_H) / 2;
      scrollContainer.scrollLeft = xOffs;
      scrollContainer.scrollTop = yOffs;

      ActionCreator.toggleCellSelection(cell, ignore, this.props.langtag);
      return cell;
    }

    if (nPagesLoaded >= page || this.tableFullyLoaded) {
      either(this.getCurrentTable().rows)
        .map(rows => rows.get(row).cells)
        .map(cells => cells.get(cellId))
        .map(focusCell)
        .orElse(() => this.cellJumpError(`There is no row ${row} in this table!`))
      this.pendingCellGoto = null;
    } else {
      this.pendingCellGoto = {
        page: page,
        row: row,
        column: column
      };
    }
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
    this.tableFullyLoaded = false;

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
        this.tableFullyLoaded = true;
        this.checkGotoCellRequest(page, table.rows.pageCount());
        ActionCreator.spinnerOff();
        return;
      }
      new Promise((resolve, reject) => {
        table.rows.fetchPage(page,
          {
            reset: page === 1,
            success: () => {
              console.log("Table page number", page, ((page > 1) ? "of " + total + " " : "") + "successfully fetched");

              if (page === 1) {
                this.setState({
                  initialLoading: false,
                  rowsCollection: table.rows,
                  currentTableId: tableId,
                  rowsFilter: null
                });
              }

              this.checkGotoCellRequest(page);

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
      .forEach(x => x.visible = val)
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
      this.pendingCellGoto = null;
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
      var tables = this.tables;
      var rowsCollection = this.state.rowsCollection;
      var currentTable = this.getCurrentTable();

      var table = '';
      if (this.state.currentTableId) {
        if (typeof tables.get(this.state.currentTableId) !== 'undefined') {
          table = <Table key={this.state.currentTableId} table={currentTable}
                         langtag={this.props.langtag} rows={rowsCollection}
                         overlayOpen={this.props.overlayOpen}
                         locationBar={this.locationBar}
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
}
;

TableView.propTypes = {
  langtag: React.PropTypes.string.isRequired,
  overlayOpen: React.PropTypes.bool.isRequired,
  tableId: React.PropTypes.number
};

export default TableView;