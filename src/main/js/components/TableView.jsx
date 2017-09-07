import React from "react";
import connectToAmpersand from "./helperComponents/connectToAmpersand";
import Dispatcher from "../dispatcher/Dispatcher";
import Table from "./table/Table.jsx";
import LanguageSwitcher from "./header/LanguageSwitcher.jsx";
import TableSwitcher from "./header/tableSwitcher/TableSwitcher.jsx";
import ActionCreator from "../actions/ActionCreator";
import Tables from "../models/Tables";
import * as _ from "lodash";
import * as f from "lodash/fp";
import TableauxConstants, {ActionTypes, FilterModes} from "../constants/TableauxConstants";
import Filter from "./header/filter/Filter.jsx";
import Navigation from "./header/Navigation.jsx";
import PageTitle from "./header/PageTitle.jsx";
import Spinner from "./header/Spinner.jsx";
import TableSettings from "./header/tableSettings/TableSettings";
import ColumnFilter from "./header/ColumnFilter";
import {either} from "../helpers/functools";
import {INITIAL_PAGE_SIZE, PAGE_SIZE} from "../models/Rows";
import getFilteredRows from "./table/RowFilters";
import i18n from "i18next";
import App from "ampersand-app";
import pasteCellValue from "./cells/cellCopyHelper";
import {openEntityView} from "./overlay/EntityViewOverlay";
import Portal from "react-portal";
import JumpSpinner from "./table/JumpSpinner";

@connectToAmpersand
class TableView extends React.Component {

  constructor(props) {
    super(props);

    const {columnId, rowId} = props;
    const {filter, entityView} = props.urlOptions || {};

    this.nextTableId = null;
    this.pendingCellGoto = null;
    this.state = {
      initialLoading: true,
      currentTableId: this.props.tableId,
      rowsCollection: null,
      rowsFilter: (f.isObject(filter) && !f.isEmpty(filter)) ? {filters: [filter]} : null,
      pasteOriginCell: {},
      pasteOriginCellLang: props.langtag,
      tableFullyLoaded: false
    };

    if (rowId) {
      this.pendingCellGoto = {
        page: this.estimateCellPage(rowId),
        rowId,
        columnId,
        filter,
        entityView
      };
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

  setCopyOrigin = ({cell, langtag}) => {
    this.setState({
      pasteOriginCell: cell,
      pasteOriginCellLang: langtag
    });
  };

  pasteCellTo = ({cell, langtag}) => {
    const src = this.state.pasteOriginCell;
    const srcLang = this.state.pasteOriginCellLang;
    pasteCellValue.call(this, src, srcLang, cell, langtag);
  };

  clearCellClipboard = () => {
    this.setState({pasteOriginCell: {}});
  };

  resetURL = () => {
    App.router.navigate(`${this.props.langtag}/tables/${this.state.currentTableId}`);
  };

  getStoredViewObject = (tableId = null, name = "default") => {
    if (tableId) {
      return either(localStorage)
        .map(f.get("tableViews"))
        .map(JSON.parse)
        .map(f.get([tableId, name]))
        .getOrElse(null);
    } else {
      return either(localStorage)
        .map(f.get("tableViews"))
        .map(JSON.parse)
        .getOrElse({});
    }
  };

  // tries to extract [tableId][name] from views in memory, falls back to "first ten visible"
  loadView = (tableId, name = "default") => {
    const table = this.tables.get(tableId);
    const DEFAULT_VISIBLE_COLUMS = 10;
    if (!table) {
      console.warn("Could not access table ID", tableId, "of", this.tables);
      return;
    }

    const cols = table.columns.models;
    const storedViewObject = this.getStoredViewObject(tableId);
    const savedView = f.get("visibleColumns", storedViewObject);

    if (savedView) {
      cols.map(col => {
        col.visible = savedView[col.id];
      });
    } else {
      cols.forEach(x => {
        x.visible = false;
      });
      f.compose(
        f.map(x => { x.visible = true; }),
        f.take(DEFAULT_VISIBLE_COLUMS),
        f.drop(1),
        f.reject(f.get("isGroupMember"))
      )(cols);
    }

    // don't override filters set by url
    if (f.isEmpty(this.state.rowsFilter)) {
      this.setState({rowsFilter: f.get("rowsFilter", storedViewObject)});
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
    const savedViews = this.getStoredViewObject(null, name);
    localStorage["tableViews"] = JSON.stringify(f.set([currentTableId, name, "visibleColumns"], view, savedViews));
  };

  saveFilterSettings = (settings = {}, name = "default") => {
    if (!localStorage) {
      return;
    }

    const {currentTableId} = this.state;
    const savedViews = this.getStoredViewObject(null, name);
    const newViewsObj = f.set([currentTableId, name, "rowsFilter"], settings, savedViews);
    localStorage["tableViews"] = JSON.stringify(newViewsObj);
  };

  cellJumpError = msg => {
    ActionCreator.showToast(
      <div id="cell-jump-toast">{msg}</div>,
      7000
    );
  };

  checkGotoCellRequest = (loaded) => {
    if (!this.pendingCellGoto) {
      return;
    }
    const columns = this.getCurrentTable().columns.models;
    const columnId = this.pendingCellGoto.columnId || f.first(columns).getId();
    if (!this.checkIfColExists(columns, columnId)) {
      return;
    }
    const {page} = this.pendingCellGoto;
    if (loaded >= page || this.state.tableFullyLoaded) {
      this.gotoCell(this.pendingCellGoto, loaded);
    }
  };

  // needs the columns.models as argument, else won't find correct column
  checkIfColExists = (columns, colId) => {
    if (f.findIndex(f.matchesProperty("id", colId), columns) < 0) {
      this.cellJumpError(i18n.t("table:jump.no_such_column", {col: colId}));
      this.pendingCellGoto = null;
      return false;
    } else {
      return true;
    }
  };

  estimateCellPage = rowId => 1 + Math.ceil((rowId - INITIAL_PAGE_SIZE) / PAGE_SIZE);

  gotoCell = ({rowId, columnId, page, filter, ignore = "NO_HISTORY_PUSH", entityView}, nPagesLoaded = 0) => {
    const colId = columnId || f.first(this.getCurrentTable().columns.models).getId();
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
          filters: [
            (f.isObject(filter))
              ? filter
              : {
                mode: FilterModes.ID_ONLY,
                value: [rowId]
              }
          ],
          sorting: {columnId: 0}
        },
        false);
      }
      const rows = this.getCurrentTable().rows.models;
      const rowIndex = f.findIndex(f.matchesProperty("id", rowId), rows);

      this.pendingCellGoto = null;
      ActionCreator.toggleCellSelection(cell, true, this.props.langtag);
      if (entityView) {
        openEntityView(rows.at(rowIndex), this.props.langtag, cellId);
      } else {
        this.forceUpdate();
      }
      return cell;
    };

    if (nPagesLoaded >= page || this.state.tableFullyLoaded) {
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
    if (f.isNil(currentTable)) {
      const here = window.location.href.toString();
      const firstTable = here.replace(/\/tables.*/, "");
      window.location = firstTable;
      return;
    }
    this.setState({
      initialLoading: true,
      tableFullyLoaded: false
    });

    ActionCreator.spinnerOn();
    let fetchedPages = 0;

    // We need to fetch columns first, since rows has Cells that depend on the column model
    const fetchColumns = table => new Promise(
      (resolve, reject) => {
        ActionCreator.spinnerOn();
        table.columns.fetch({
          reset: true,
          success: () => {
            this.setState({
              currentTableId: tableId,
              initialLoading: false
            }, () => this.loadView(table.id));
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
      }
    );

    const fetchPages = () => new Promise(
      (resolve, reject) => {
        ActionCreator.spinnerOn();
        currentTable.rows.fetchPage(1,
          {
            success: (totalPages) => {
              ++fetchedPages;
              this.setState({
                currentTableId: tableId,
                tableFullyLoaded: fetchedPages >= totalPages
              }, ((fetchedPages === 1) ? applyStoredViews : f.noop));
              this.checkGotoCellRequest(fetchedPages);
              if (fetchedPages >= totalPages) {
                ActionCreator.spinnerOff();
                resolve();
              }
            },
            error: e => {
              ActionCreator.spinnerOff();
              reject("Error fetching pages:" + e);
            }
          });
      }
    );

    const applyStoredViews = () => new Promise(
      (resolve) => {
        const {rowsFilter} = this.state;
        if (!f.isEmpty(rowsFilter && rowsFilter.filters)) {
          this.changeFilter(rowsFilter, false);
        }
        resolve();
      }
    );

    const start = performance.now();
    fetchColumns(currentTable)
      .then(fetchPages)
      .then(applyStoredViews)
      .then(() => window.devLog("Loading took", (performance.now() - start) / 1000, "s"));
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
      && (nextProps.columnId !== this.props.columnId || nextProps.rowId !== this.props.rowId)) {
      this.gotoCell({
        columnId: nextProps.columnId,
        rowId: nextProps.rowId,
        filter: false,
        page: this.estimateCellPage(nextProps.rowId)
      });
    }
  };

  // Set visibility of all columns in <coll> to <val>
  setColumnsVisibility = ({val, coll, cb}) => {
    const columns = this.tables.get(this.state.currentTableId).columns;
    columns
      .filter(x => f.contains(x.id, coll))
      .forEach(x => {
        x.visible = val;
      });
    this.saveView();
    if (cb) {
      cb();
    }
    this.forceUpdate();
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
    }, this.saveFilterSettings);
    const clearedUrl = window.location.href
                             .replace(/https?:\/\/.*?\//, "")
                             .replace(/\?.*/, "");
    App.router.navigate(clearedUrl, {trigger: false});
  };

  changeFilter = (settings = {}, store = true) => {
    const {filters = [], sorting = {}} = settings;
    const isFilterEmpty = filter => _.isEmpty(filter.value) && !_.isString(filter.mode);
    const isSortingEmpty = !_.isFinite(sorting.columnId) && _.isEmpty(sorting.value);
    const areAllFiltersEmpty = f.every(isFilterEmpty, filters);

    const storeFilterSettingsIfRequested = () => {
      if (store) {
        this.saveFilterSettings(settings);
      }
    };

    new Promise(
      (resolve) => {
        if (areAllFiltersEmpty && isSortingEmpty) {
          this.setState({
            rowsFilter: null,
            rowsCollection: this.getCurrentTable().rows
          }, resolve(null));
        } else {
          const rowsFilter = {
            sortColumnId: sorting.columnId,
            sortValue: sorting.value,
            filters: f.reject(isFilterEmpty, filters)
          };
          if (f.get([0, "mode"], filters) !== FilterModes.ID_ONLY) {
            this.resetURL();
          }
          this.setState({
            rowsFilter,
            rowsCollection: getFilteredRows(this.getCurrentTable(), this.props.langtag, rowsFilter)
          }, resolve(rowsFilter));
        }
      }
    ).then(storeFilterSettingsIfRequested);
  };

  getCurrentTable = () => {
    return this.tables.get(this.state.currentTableId);
  };

  doSwitchTable = () => {
    if (this.nextTableId) {
      this.pendingCellGoto = null;
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
      const tables = this.tables;
      const {rowsCollection, tableFullyLoaded, pasteOriginCell, rowsFilter} = this.state;
      const {langtag, overlayOpen} = this.props;
      const currentTable = this.getCurrentTable();

      if (f.isNil(currentTable)) {
        console.error("No table found with id " + this.state.currentTableId);
      }

      const rows = rowsCollection || currentTable.rows || {};
      // pass concatenated row ids on, so children will re-render on sort, filter, add, etc.
      // without adding event listeners
      const rowKeys = f.compose(
        f.toString,
        f.map(f.get("id")),
        f.get("models")
      )(rows);
      const columnKeys = f.compose(
        f.toString,
        f.map(f.get("id")),
        f.filter((col, idx) => col.visible || idx === 0),
        f.get("models")
      )(currentTable.columns);

      return (
        <div>
          <header>
            <Navigation langtag={this.props.langtag} />
            <div id="clipboard-icon">
              {(!f.isEmpty(pasteOriginCell))
                ? (
                  <a href="#" className="button" onClick={this.clearCellClipboard}>
                    <i className="fa fa-clipboard" />
                  </a>
                )
                : null
              }
            </div>
            <TableSwitcher langtag={langtag}
                           currentTable={currentTable}
                           tables={tables} />
            <TableSettings langtag={langtag} table={currentTable} />
            <Filter langtag={langtag} table={currentTable} currentFilter={rowsFilter} />
            {(currentTable && currentTable.columns && currentTable.columns.length > 1)
              ? <ColumnFilter langtag={langtag}
                              columns={currentTable.columns}
              />
              : null
            }
            <LanguageSwitcher langtag={this.props.langtag} onChange={this.onLanguageSwitch} />
            <PageTitle titleKey="pageTitle.tables" />
            <Spinner />
          </header>
          <div className="wrapper">
            <Table fullyLoaded={tableFullyLoaded}
                   table={currentTable}
                   langtag={langtag} rows={rows} overlayOpen={overlayOpen}
                   rowKeys={rowKeys}
                   columnKeys={columnKeys}
                   pasteOriginCell={pasteOriginCell}
                   tables={tables}
                   disableOnClickOutside={this.props.overlayOpen}
            />
            }
          </div>
          {(this.pendingCellGoto)
            ? (
              <Portal isOpened>
                <JumpSpinner />
              </Portal>
            )
            : null
          }
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
