import React, {Component} from "react";
import PropTypes from "prop-types";
import connectToAmpersand from "../helperComponents/connectToAmpersand";
import Dispatcher from "../../dispatcher/Dispatcher";
import Table from "../table/Table.jsx";
import LanguageSwitcher from "../header/LanguageSwitcher.jsx";
import TableSwitcher from "../header/tableSwitcher/TableSwitcher.jsx";
import ActionCreator from "../../actions/ActionCreator";
import Tables from "../../models/Tables";
import f from "lodash/fp";
import TableauxConstants, {ActionTypes, FilterModes} from "../../constants/TableauxConstants";
import Filter from "../header/filter/Filter.jsx";
import Navigation from "../header/Navigation.jsx";
import PageTitle from "../header/PageTitle.jsx";
import Spinner from "../header/Spinner.jsx";
import TableSettings from "../header/tableSettings/TableSettings";
import ColumnFilter from "../header/ColumnFilter";
import {either} from "../../helpers/functools";
import {INITIAL_PAGE_SIZE, PAGE_SIZE} from "../../models/Rows";
import getFilteredRows from "../table/RowFilters";
import i18n from "i18next";
import App from "ampersand-app";
import pasteCellValue from "../cells/cellCopyHelper";
import {openEntityView} from "../overlay/EntityViewOverlay";
import JumpSpinner from "./JumpSpinner";
import withCustomProjection from "../helperComponents/withCustomProjection";
import PasteCellIcon from "../header/PasteCellIcon";
import {showDialog} from "../overlay/GenericOverlay";
import SearchOverlay from "./SearchOverlay";
import HistoryButtons from "../table/undo/HistoryButtons";
import {initHistoryOf} from "../table/undo/tableHistory";

const BIG_TABLE_THRESHOLD = 10000; // Threshold to decide when a table is so big we might not want to search it

@withCustomProjection
@connectToAmpersand
class TableView extends Component {
  constructor(props) {
    super(props);

    const {columnId, rowId} = props;
    const {entityView} = props.urlOptions || {};

    this.nextTableId = null;
    this.pendingCellGoto = null;
    this.state = {
      initialLoading: true,
      currentTableId: this.props.tableId,
      rowsCollection: null,
      pasteOriginCell: {},
      pasteOriginCellLang: props.langtag,
      tableFullyLoaded: false
    };

    if (rowId) {
      this.pendingCellGoto = {
        page: this.estimateCellPage(rowId),
        rowId,
        columnId,
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

  gotoCell = ({rowId, columnId, page, ignore = "NO_HISTORY_PUSH", entityView}, nPagesLoaded = 0) => {
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
      this.forceUpdate();
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
          initHistoryOf(this.tables);
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
            }, this.applyProjection);
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
        this.applyProjection();
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
    if ((f.isNil(nextProps.tableId) || nextProps.tableId === this.props.tableId)) {
      // Table ID did not change, check independently for changes of row- and column projection
      if (!f.equals(this.props.projection.rows, nextProps.projection.rows)) {
        this.applyFilters(nextProps.projection);
      }
      if (!f.equals(this.props.projection.columns, nextProps.projection.columns)) {
        this.applyColumnVisibility(nextProps.projection);
      }
    }
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
        page: this.estimateCellPage(nextProps.rowId)
      });
    }
  };

  // Set visibility of all columns in <coll> to <val>
  setColumnsVisibility = ({val, coll, cb}, shouldSave = true) => {
    this.props.setColumnVisibility({
      val,
      colIds: coll,
      callback: cb
    }, shouldSave);
  };

  applyColumnVisibility = (projection = this.props.projection) => {
    const DEFAULT_VISIBLE_COLUMNS = 10;
    const columns = f.getOr([], ["columns", "models"], this.getCurrentTable());
    const colIds = columns.map(f.get("id"));
    if (f.isEmpty(colIds)) {
      return; // don't try to sanitise visible columns when column data not yet loaded
    }
    const visibleColIds = f.get("columns", projection)
      || f.take(DEFAULT_VISIBLE_COLUMNS, colIds);
    if (f.isNil(projection.columns)) {
      this.setColumnsVisibility({
        val: true,
        coll: visibleColIds
      }, true);
    }
    columns.forEach(
      (col, idx) => {
        col.visible = idx === 0 || f.contains(col.id, visibleColIds);
      }
    );
    this.forceUpdate();
  };

  applyProjection = (projection = this.props.projection) => {
    this.applyFilters(projection);
    this.applyColumnVisibility(projection);
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
    this.props.setFilter({}, true);
    const clearedUrl = window.location.href
                             .replace(/https?:\/\/.*?\//, "")
                             .replace(/\?.*/, "");
    App.router.navigate(clearedUrl, {trigger: false});
  };

  applyFilters = (projection = this.props.projection) => {
    const rowFilter = f.get("rows", projection);
    const tableRows = f.getOr([], "rows", this.getCurrentTable());

    if (f.isEmpty(rowFilter) || (f.isEmpty(rowFilter.filters) && f.isNil(rowFilter.sortColumnId))) {
      this.setState({rowsCollection: tableRows});
    } else {
      const doApplyFilters = () => {
        const rowsCollection = getFilteredRows(this.getCurrentTable(), this.props.langtag, rowFilter);
        if (!f.isEmpty(rowsCollection.colsWithMatches)) {
          this.props.setColumnVisibility({val: false}, false);
          this.props.setColumnVisibility({
            val: true,
            colIds: rowsCollection.colsWithMatches
          });
        }
        this.setState({rowsCollection});
        if (this.state.tableFullyLoaded) {
          this.displaySearchOverlay(false);
        }
      };
      this.displaySearchOverlay(true, doApplyFilters);
    }
  };

  displaySearchOverlay = (state = true, cb = f.noop) => {
    this.setState({searchOverlayOpen: state}, () => window.setTimeout(cb, 250));
  };

  changeFilter = (settings = {}, store = true) => {
    const currentTable = this.getCurrentTable();
    const hasSlowFilters = f.flow(
      f.get("filters"),
      f.map(f.get("mode")),
      f.any(f.contains(f, [FilterModes.ROW_CONTAINS]))
    );

    if (
      hasSlowFilters(settings)
      && currentTable.rows.length * currentTable.columns.length > BIG_TABLE_THRESHOLD
    ) {
      showDialog({
        type: "question",
        context: "Filter",
        title: i18n.t("filter:large-table.title"),
        message: i18n.t("filter:large-table.message"),
        heading: i18n.t("filter:large-table.header"),
        actions: {
          "positive": [i18n.t("common:ok"), () => this.props.setFilter(settings, store)],
          "neutral": [i18n.t("common:cancel"), this.clearFilter]
        }
      });
    } else {
      this.props.setFilter(settings, store);
    }
  };

  getCurrentTable = () => {
    return this.tables.get(this.state.currentTableId);
  };

  doSwitchTable = () => {
    if (this.nextTableId) {
      this.pendingCellGoto = null;
      this.props.resetStoredProjection();
      this.fetchTable(this.nextTableId);
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
      const {rowsCollection, tableFullyLoaded, pasteOriginCell, pasteOriginCellLang, currentTableId} = this.state;
      const {langtag, overlayOpen} = this.props;
      const currentTable = this.getCurrentTable();

      if (f.isNil(currentTable)) {
        console.error("No table found with id " + this.state.currentTableId);
      }

      const rows = rowsCollection || currentTable.rows || {};
      // pass concatenated row ids on, so children will re-render on sort, filter, add, etc.
      // without adding event listeners
      const rowKeys = f.flow(
        f.get("models"),
        f.map(f.get("id")),
        f.toString
      )(rows);
      const columnKeys = f.flow(
        f.get("models"),
        (models) => models.filter((col, idx) => col.visible || idx === 0),
        f.map(f.get("id")),
        f.toString
      )(currentTable.columns);

      return (
        <div>
          <header>
            <Navigation langtag={this.props.langtag} />
            <TableSwitcher
              langtag={langtag}
              currentTable={currentTable}
              tables={tables} />
            <TableSettings langtag={langtag} table={currentTable} />
            <Filter
              langtag={langtag}
              table={currentTable}
              currentFilter={this.props.projection.rows}
            />
            {(currentTable && currentTable.columns && currentTable.columns.length > 1)
              ? (
                <ColumnFilter
                  langtag={langtag}
                  columns={currentTable.columns}
                />
              )
              : <div/>
            }
            <HistoryButtons tableId={currentTableId}/>
            <div className="header-separator" />
            <Spinner />
            <PageTitle titleKey="pageTitle.tables" />
            <LanguageSwitcher langtag={this.props.langtag} onChange={this.onLanguageSwitch} />
            <PasteCellIcon clearCellClipboard={this.clearCellClipboard}
                           pasteOriginCell={pasteOriginCell}
                           pasteOriginCellLang={pasteOriginCellLang}
                           tableId={currentTable.id}
            />
          </header>
          <div className="wrapper">
            <Table
              fullyLoaded={tableFullyLoaded}
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
          <JumpSpinner isOpen={!!this.pendingCellGoto && !this.state.searchOverlayOpen} />
          <SearchOverlay isOpen={this.state.searchOverlayOpen} />
        </div>
      );
    }
  }
}

TableView.propTypes = {
  langtag: PropTypes.string.isRequired,
  overlayOpen: PropTypes.bool.isRequired,
  tableId: PropTypes.number,
  projection: PropTypes.object
};

export default TableView;
