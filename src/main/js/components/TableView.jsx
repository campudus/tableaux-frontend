import React from "react";
import connectToAmpersand from "../helpers/connectToAmpersand";
import Dispatcher from "../dispatcher/Dispatcher";
import Table from "./table/Table.jsx";
import LanguageSwitcher from "./header/LanguageSwitcher.jsx";
import TableSwitcher from "./header/tableSwitcher/TableSwitcher.jsx";
import ActionCreator from "../actions/ActionCreator";
import Tables from "../models/Tables";
import * as AccessControl from "../helpers/accessManagementHelper";
import * as _ from "lodash";
import * as f from "lodash/fp";
import TableauxConstants, {SortValues, ActionTypes, FilterModes, ColumnKinds} from "../constants/TableauxConstants";
import Filter from "./header/filter/Filter.jsx";
import Navigation from "./header/Navigation.jsx";
import PageTitle from "./header/PageTitle.jsx";
import Spinner from "./header/Spinner.jsx";
import TableSettings from "./header/tableSettings/TableSettings";
import ColumnFilter from "./header/ColumnFilter";
import {either} from "../helpers/monads";
import {PAGE_SIZE, INITIAL_PAGE_SIZE} from "../models/Rows";
import getFilteredRows from "./table/RowFilters";
import i18n from "i18next";
import App from "ampersand-app";
import pasteCellValue from "./cells/cellCopyHelper";

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
      rowsFilter: null,
      pasteOriginCell: {}
    };

    const {columnId, rowId, filter} = this.props;
    if (rowId) {
      this.pendingCellGoto = {
        page: this.estimateCellPage(rowId),
        rowId: rowId,
        columnId: columnId,
        filter: filter
      }
    }
  };

  componentWillMount = () => {
    Dispatcher.on(ActionTypes.CLEANUP_TABLE_DONE, this.doSwitchTable);
    Dispatcher.on(ActionTypes.CHANGE_FILTER, this.changeFilter);
    Dispatcher.on(ActionTypes.CLEAR_FILTER, this.clearFilter);
    Dispatcher.on(ActionTypes.SET_COLUMNS_VISIBILITY, this.setColumnsVisibility, this);
    Dispatcher.on(ActionTypes.RESET_TABLE_URL, this.resetURL);
    Dispatcher.on(ActionTypes.COPY_CELL_CONTENT, this.setCopyOrigin);
    Dispatcher.on(ActionTypes.PASTE_CELL_CONTENT, this.pasteCellTo);
  };

  componentWillUnmount = () => {
    Dispatcher.off(ActionTypes.CLEANUP_TABLE_DONE, this.doSwitchTable);
    Dispatcher.off(ActionTypes.CHANGE_FILTER, this.changeFilter);
    Dispatcher.off(ActionTypes.CLEAR_FILTER, this.clearFilter);
    Dispatcher.off(ActionTypes.SET_COLUMNS_VISIBILITY, this.setColumnsVisibility, this);
    Dispatcher.off(ActionTypes.RESET_TABLE_URL, this.resetURL);
    Dispatcher.off(ActionTypes.COPY_CELL_CONTENT, this.setCopyOrigin);
    Dispatcher.off(ActionTypes.PASTE_CELL_CONTENT, this.pasteCellTo);
  };

  setCopyOrigin = cell => {
    this.setState({pasteOriginCell: cell});
  };

  pasteCellTo = ({cell}) => {
    pasteCellValue.call(this, this.state.pasteOriginCell.cell, cell);
  };

  clearCellClipboard = () => {
    this.setState({pasteOriginCell: {}});
  };

  resetURL = () => {
    App.router.navigate(`${this.props.langtag}/tables/${this.state.currentTableId}`);
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
    localStorage["tableViews"] = JSON.stringify(f.set([currentTableId, name], view, savedViews));
  };

  cellJumpError = msg => {
    ActionCreator.showToast(
      <div id="cell-jump-toast">{msg}</div>,
      7000
    )
  };

  checkGotoCellRequest = (loaded) => {
    if (!this.pendingCellGoto) {
      return;
    }
    ActionCreator.jumpSpinnerOn();
    const columns = this.getCurrentTable().columns.models;
    const columnId = this.pendingCellGoto.columnId || f.first(columns).getId();
    if (!this.checkIfColExists(columns, columnId)) {
      return;
    }
    const {page} = this.pendingCellGoto;
    if (loaded >= page || this.tableFullyLoaded) {
      this.gotoCell(this.pendingCellGoto, loaded);
    }
  };

  // needs the columns.models as argument, else won't find correct column
  checkIfColExists = (columns, colId) => {
    if (f.findIndex(f.matchesProperty("id", colId), columns) < 0) {
      ActionCreator.jumpSpinnerOff();
      this.cellJumpError(i18n.t("table:jump.no_such_column", {col: colId}));
      this.pendingCellGoto = null;
      return false;
    } else {
      return true;
    }
  };

  estimateCellPage = rowId => 1 + Math.ceil((rowId - INITIAL_PAGE_SIZE) / PAGE_SIZE);

  gotoCell = ({rowId, columnId, page, filter, ignore = "NO_HISTORY_PUSH"}, nPagesLoaded = 0) => {
    const colId = columnId || f.first(this.getCurrentTable().columns.models).getId();
    ActionCreator.jumpSpinnerOn();
    if (!this.checkIfColExists(this.getCurrentTable().columns.models, colId)) {
      return;
    }
    const cellId = `cell-${this.state.currentTableId}-${colId}-${rowId}`;

    // Helper closure
    const focusCell = cell => {
      this.setColumnsVisibility({
        val: true,
        coll: [colId]
      });
      if (filter) {
        this.changeFilter({
          filterMode: FilterModes.ID_ONLY,
          filterValue: rowId,
          filterColumnId: "noop",
          sortColumnId: 0
        });
      }
      const rows = this.getCurrentTable().rows.models;
      const rowIndex = f.findIndex(f.matchesProperty('id', rowId), rows);
      const columns = this.getCurrentTable().columns.models;
      const visibleColumns = columns.filter(x => x.visible);
      const colIndex = f.findIndex(f.matchesProperty("id", colId), visibleColumns);
      const scrollContainer = f.first(document.getElementsByClassName("data-wrapper"));
      const xOffs = ID_CELL_W + (colIndex) * CELL_W - (window.innerWidth - CELL_W) / 2;
      const yOffs = (filter)
        ? 0
        : CELL_H * rowIndex - (scrollContainer.getBoundingClientRect().height - CELL_H) / 2;
      scrollContainer.scrollLeft = xOffs;
      scrollContainer.scrollTop = yOffs;

      ActionCreator.toggleCellSelection(cell, ignore, this.props.langtag);
      return cell;
    };

    if (nPagesLoaded >= page || this.tableFullyLoaded) {
      either(this.getCurrentTable().rows)
        .map(rows => rows.get(rowId).cells)
        .map(cells => cells.get(cellId))
        .map(focusCell)
        .orElse(() => this.cellJumpError(i18n.t("table:jump.no_such_row", {row: rowId})));
      ActionCreator.jumpSpinnerOff();
      this.pendingCellGoto = null;
    } else {
      this.pendingCellGoto = {
        rowId: rowId,
        columnId: colId,
        page: this.estimateCellPage(rowId)
      };
    }
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
    ActionCreator.spinnerOn();

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
      ActionCreator.spinnerOn();
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

  componentWillReceiveProps = (nextProps) => {
    if (nextProps.tableId !== this.props.tableId) {
      let oldTable = this.tables.get(this.state.currentTableId);
      this.nextTableId = nextProps.tableId;
      if (oldTable) {
        ActionCreator.cleanupTable(oldTable);
      } else {
        this.doSwitchTable();
      }
    } else if (nextProps.rowId
      && (nextProps.columnId != this.props.columnId || nextProps.rowId != this.props.rowId)) {
      this.gotoCell({
        columnId: nextProps.columnId,
        rowId: nextProps.rowId,
        filter: false,
        page: this.estimateCellPage(nextProps.rowId)
      })
    }
  };

  //Set visibility of all columns in <coll> to <val>
  setColumnsVisibility = ({val, coll, cb}) => {
    const columns = this.tables.get(this.state.currentTableId).columns;
    columns
      .filter(x => f.contains(x.id, coll))
      .forEach(x => x.visible = val);
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
      rowsCollection = getFilteredRows(this.getCurrentTable(), this.props.langtag, rowsFilter);
      if (rowsFilter.filterMode !== FilterModes.ID_ONLY) {
        this.resetURL();
      }
    }

    this.setState({
      rowsCollection: rowsCollection,
      rowsFilter: rowsFilter
    });
  };

  getCurrentTable = () => {
    return this.tables.get(this.state.currentTableId);
  };

  doSwitchTable = () => {
    if (this.nextTableId) {
      if (either(this.state.pasteOriginCell.cell)
          .map(f.prop("kind"))
          .map(f.eq(ColumnKinds.link))
          .getOrElse(false))
      {
        this.setState({pasteOriginCell: {}})
      }
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
      let tables = this.tables;
      let rowsCollection = this.state.rowsCollection;
      let currentTable = this.getCurrentTable();

      let table = '';
      if (this.state.currentTableId) {
        if (typeof tables.get(this.state.currentTableId) !== 'undefined') {
          table = <Table key={this.state.currentTableId} table={currentTable}
                         langtag={this.props.langtag} rows={rowsCollection} overlayOpen={this.props.overlayOpen}
                         pasteOriginCell={this.state.pasteOriginCell}
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
            <div id="clipboard-icon">
              {(!f.isEmpty(this.state.pasteOriginCell))
                ? (
                  <a href="#" className="button" onClick={this.clearCellClipboard}>
                    <i className="fa fa-clipboard"/>
                  </a>
                )
                : null
              }
            </div>
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

TableView.propTypes = {
  langtag: React.PropTypes.string.isRequired,
  overlayOpen: React.PropTypes.bool.isRequired,
  tableId: React.PropTypes.number
};

export default TableView;