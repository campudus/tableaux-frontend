import React, {Component} from "react";
import PropTypes from "prop-types";
// import connectToAmpersand from "../helperComponents/connectToAmpersand";
// import Dispatcher from "../../dispatcher/Dispatcher";
import Table from "../table/Table.jsx";
import LanguageSwitcher from "../header/LanguageSwitcher.jsx";
import TableSwitcher from "../header/tableSwitcher/TableSwitcher.jsx";
// import ActionCreator from "../../actions/ActionCreator";
import f from "lodash/fp";
import TableauxConstants, {ActionTypes, FilterModes} from "../../constants/TableauxConstants";
import Filter from "../header/filter/Filter.jsx";
import Navigation from "../header/Navigation.jsx";
import PageTitle from "../header/PageTitle.jsx";
import Spinner from "../header/Spinner.jsx";
import TableSettings from "../header/tableSettings/TableSettings";
import ColumnFilter from "../header/ColumnFilter";
import getFilteredRows from "../table/RowFilters";
import i18n from "i18next";
// import App from "ampersand-app";
import pasteCellValue from "../cells/cellCopyHelper";
import JumpSpinner from "./JumpSpinner";
import withCustomProjection from "./withCustomProjection";
import PasteCellIcon from "../header/PasteCellIcon";
import {showDialog} from "../overlay/GenericOverlay";
import SearchOverlay from "./SearchOverlay";
import HistoryButtons from "../table/undo/HistoryButtons";
import {initHistoryOf} from "../table/undo/tableHistory";
import {getMultiLangValue} from "../../helpers/multiLanguage";
import canFocusCell from "./canFocusCell";

const BIG_TABLE_THRESHOLD = 10000; // Threshold to decide when a table is so big we might not want to search it

@withCustomProjection
// @canFocusCell
// @connectToAmpersand
class TableView extends Component {
  constructor(props) {
    super(props);

    this.state = {
      initialLoading: false,
      rowsCollection: null,
      pasteOriginCell: {},
      pasteOriginCellLang: props.langtag,
      tableFullyLoaded: true,
      searchOverlayOpen: false
    };
  };

  componentWillMount = () => {
    // Dispatcher.on(ActionTypes.CHANGE_FILTER, this.changeFilter);
    // Dispatcher.on(ActionTypes.CLEAR_FILTER, this.clearFilter);
    // Dispatcher.on(ActionTypes.SET_COLUMNS_VISIBILITY, this.setColumnsVisibility, this);
    // Dispatcher.on(ActionTypes.RESET_TABLE_URL, this.resetURL);
    // Dispatcher.on(ActionTypes.COPY_CELL_CONTENT, this.setCopyOrigin);
    // Dispatcher.on(ActionTypes.PASTE_CELL_CONTENT, this.pasteCellTo);
  };

  componentWillUnmount = () => {
    // Dispatcher.off(ActionTypes.CHANGE_FILTER, this.changeFilter);
    // Dispatcher.off(ActionTypes.CLEAR_FILTER, this.clearFilter);
    // Dispatcher.off(ActionTypes.SET_COLUMNS_VISIBILITY, this.setColumnsVisibility, this);
    // Dispatcher.off(ActionTypes.RESET_TABLE_URL, this.resetURL);
    // Dispatcher.off(ActionTypes.COPY_CELL_CONTENT, this.setCopyOrigin);
    // Dispatcher.off(ActionTypes.PASTE_CELL_CONTENT, this.pasteCellTo);
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
    // const history = App.router.history;
    const clearedUrl = history.getPath()
      .replace(/\?*/, "");
    // App.router.history.navigate(clearedUrl,
    //   {
    //     trigger: false,
    //     replace: true
    //   });
  };

  componentDidMount = () => {
    // ActionCreator.spinnerOn();
    initHistoryOf(this.props.tables);
    this.fetchTable(this.props.table.id);
  };

  fetchTable = (tableId) => {
    const currentTable = this.props.table;
    this.setState({
      initialLoading: true,
      tableFullyLoaded: false
    });

    // ActionCreator.spinnerOn();
    let fetchedPages = 0;

    const fetchColumns = () => console.log("fetchColumns");
    // We need to fetch columns first, since rows has Cells that depend on the column model
    // const fetchColumns = table => new Promise(
    //   (resolve, reject) => {
    //     // ActionCreator.spinnerOn();
    //     table.columns.fetch({
    //       reset: true,
    //       success: () => {
    //         this.setState({
    //           initialLoading: false
    //         }, this.applyProjection);
    //         resolve({ // return information about first page to be fetched
    //           table: table,
    //           page: 1
    //         });
    //       },
    //       error: e => {
    //         // ActionCreator.spinnerOff();
    //         reject("Error fetching table columns:" + JSON.stringify(e));
    //       }
    //     });
    //   }
    // );

    const fetchPages = () => new Promise(
      (resolve, reject) => {
        // ActionCreator.spinnerOn();
        currentTable.rows.fetchPage(1,
          {
            success: (totalPages) => {
              ++fetchedPages;
              const tableFullyLoaded = fetchedPages >= totalPages;
              this.setState({
                tableFullyLoaded
              }, ((fetchedPages === 1) ? applyStoredViews : f.noop));
              // this.props.checkCellFocus(tableFullyLoaded);
              if (fetchedPages >= totalPages) {
                // ActionCreator.spinnerOff();
                resolve();
              }
            },
            error: e => {
              // ActionCreator.spinnerOff();
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
    // fetchColumns(currentTable)
    //   .then(fetchPages)
    //   .then(applyStoredViews)
    //   .then(() => console.log("Loading took", (performance.now() - start) / 1000, "s"));
  };

  componentWillReceiveProps = (nextProps) => {
    if (this.props.table === nextProps.table) {
      // Table ID did not change, check independently for changes of row- and column projection

      if (!f.equals(this.props.projection.rows, nextProps.projection.rows)) {
        this.applyFilters(nextProps.projection);
      }

      if (!f.equals(this.props.projection.columns, nextProps.projection.columns)) {
        this.applyColumnVisibility(nextProps.projection);
      }
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
    const columns = f.getOr([], ["columns", "models"], this.props.table);
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
    const {table = {}, langtag} = this.props;

    if (table) {
      const tableDisplayName = getMultiLangValue(langtag, "", table.displayName);
      document.title = tableDisplayName
        ? tableDisplayName + " | " + TableauxConstants.PageTitle
        : TableauxConstants.PageTitle;
    }
  };

  componentDidUpdate = (prev) => {
    this.setDocumentTitleToTableName();
    if (prev.table !== this.props.table) {
      this.props.resetStoredProjection();
      this.fetchTable(this.props.table.id);
    }
  };

  clearFilter = () => {
    this.props.setFilter({}, true);
    this.resetURL();
  };

  applyFilters = (projection = this.props.projection) => {
    const rowFilter = f.get("rows", projection);
    const {table} = this.props;
    const tableRows = f.getOr([], "rows", table);

    if (f.isEmpty(rowFilter) || (f.isEmpty(rowFilter.filters) && f.isNil(rowFilter.sortColumnId))) {
      this.setState({rowsCollection: tableRows});
    } else {
      const doApplyFilters = () => {
        const rowsCollection = getFilteredRows(table, this.props.langtag, rowFilter);
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
    const currentTable = this.props.table;
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

  onLanguageSwitch = (newLangtag) => {
    // const history = App.router.history;
    const url = history.getPath();
    history.navigate(url.replace(this.props.langtag, newLangtag));
  };

  render = () => {
    if (/*this.state.initialLoading*/false) {
      return <div className="initial-loader"><Spinner isLoading={true} /></div>;
    } else {
      const {tables, table,columns,rows,langtag, overlayOpen, tableId} = this.props;
      console.log(this.props);
      const {rowsCollection, tableFullyLoaded, pasteOriginCell, pasteOriginCellLang} = this.state;

      if (f.isNil(table)) {
        console.error("No table found with id " + tableId);
      }

      // const rows = rowsCollection || currentTable.rows || {};
      // pass concatenated row ids on, so children will re-render on sort, filter, add, etc.
      // without adding event listeners
      const rowKeys = f.flow(
        f.get("models"),
        f.map(f.get("id")),
        f.toString
      )(rows);
      const columnKeys = f.flow(
        // f.filter((col, idx) => col.visible || idx === 0),
        f.map(f.get("id")),
        f.toString
      )(columns);

      return (
        <div>
          <header>
            <Navigation langtag={langtag} />
            <TableSwitcher
              langtag={langtag}
              currentTable={table}
              tables={tables} />
             <TableSettings langtag={langtag} table={table} />
             <Filter
              langtag={langtag}
              table={table}
              columns={columns}
              currentFilter={this.props.projection.rows}
            />
            {(table && columns && columns.length > 1)
              ? (
                <ColumnFilter
                  langtag={langtag}
                  columns={columns}
                />
              )
              : <div />
            }
             <HistoryButtons tableId={table.id} />
            <div className="header-separator" />
             <Spinner />
             <PageTitle titleKey="pageTitle.tables" />
             <LanguageSwitcher langtag={this.props.langtag} onChange={this.onLanguageSwitch} />
            <PasteCellIcon clearCellClipboard={this.clearCellClipboard}
                           pasteOriginCell={pasteOriginCell}
                           pasteOriginCellLang={pasteOriginCellLang}
                           tableId={table.id}
            />
          </header>
          <div className="wrapper">
            <Table
              fullyLoaded={tableFullyLoaded}
              table={table}
              langtag={langtag} rows={rows} overlayOpen={overlayOpen}
              rowKeys={rowKeys}
              columnKeys={columnKeys}
              columns={columns}
              pasteOriginCell={pasteOriginCell}
              tables={tables}
              disableOnClickOutside={overlayOpen}
            />
          </div>
          <JumpSpinner isOpen={!!this.props.showCellJumpOverlay && !this.state.searchOverlayOpen} />
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
