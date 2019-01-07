import React, { Component } from "react";
import PropTypes from "prop-types";
// import connectToAmpersand from "../helperComponents/connectToAmpersand";
// import Dispatcher from "../../dispatcher/Dispatcher";
import Table from "../table/Table.jsx";
import LanguageSwitcher from "../header/LanguageSwitcher.jsx";
import TableSwitcher from "../header/tableSwitcher/TableSwitcher.jsx";
// import ActionCreator from "../../actions/ActionCreator";
import f from "lodash/fp";
import TableauxConstants, {
  ActionTypes,
  FilterModes
} from "../../constants/TableauxConstants";
import Filter from "../header/filter/Filter.jsx";
import Navigation from "../header/Navigation.jsx";
import PageTitle from "../header/PageTitle.jsx";
import Spinner from "../header/Spinner.jsx";
import TableSettings from "../header/tableSettings/TableSettings";
import ColumnFilter from "../header/ColumnFilter";
import getFilteredRows from "../table/RowFilters";
import i18n from "i18next";
import TableauxRouter from "../../router/router";
import pasteCellValue from "../cells/cellCopyHelper";
import JumpSpinner from "./JumpSpinner";
import withCustomProjection from "./withCustomProjection";
import applyFiltersAndVisibility from "./applyFiltersAndVisibility";
import PasteCellIcon from "../header/PasteCellIcon";
import { showDialog } from "../overlay/GenericOverlay";
import SearchOverlay from "./SearchOverlay";
import HistoryButtons from "../table/undo/HistoryButtons";
import { initHistoryOf } from "../table/undo/tableHistory";
import { getMultiLangValue } from "../../helpers/multiLanguage";
import canFocusCell from "./canFocusCell";
import reduxActionHoc from "../../helpers/reduxActionHoc";

const BIG_TABLE_THRESHOLD = 10000; // Threshold to decide when a table is so big we might not want to search it
const mapStatetoProps = (state, props) => {
  const { tableId } = props;
  const tables = f.get("tables.data", state);
  const table = tables[tableId];
  const columns = f.get(`columns.${tableId}.data`, state);
  const rows = f.get(`rows.${tableId}.data`, state);
  const visibleColumns = f.get("tableView.visibleColumns", state);
  const tableView = f.get("tableView", state);
  const {
    filters,
    sorting,
    startedGeneratingDisplayValues,
    displayValues
  } = tableView;
  if (table) {
    TableauxConstants.initLangtags(table.langtags);
  }
  return {
    table,
    columns,
    rows,
    tables,
    visibleColumns,
    filters,
    sorting,
    startedGeneratingDisplayValues,
    displayValues,
    tableView
  };
};

@applyFiltersAndVisibility
@withCustomProjection
// @canFocusCell
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
  }

  setCopyOrigin = ({ cell, langtag }) => {
    this.setState({
      pasteOriginCell: cell,
      pasteOriginCellLang: langtag
    });
  };

  pasteCellTo = ({ cell, langtag }) => {
    const src = this.state.pasteOriginCell;
    const srcLang = this.state.pasteOriginCellLang;
    pasteCellValue.call(this, src, srcLang, cell, langtag);
  };

  clearCellClipboard = () => {
    this.setState({ pasteOriginCell: {} });
  };

  resetURL = () => {
    const history = TableauxRouter.history;
    const clearedUrl = history.getPath().replace(/\?*/, "");
    TableauxRouter.history.navigate(clearedUrl, {
      trigger: false,
      replace: true
    });
  };

  renderTableOrSpinner = () => {
    const {
      tables,
      columns,
      rows,
      displayValues,
      langtag,
      table,
      actions,
      startedGeneratingDisplayValues,
      canRenderTable,
      tableView
    } = this.props;
    if (!canRenderTable) {
      return (
        <div className="initial-loader">
          <Spinner isLoading={true} />
        </div>
      );
    } else {
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
        <div className="wrapper">
          <Table
            actions={actions}
            displayValues={displayValues}
            tableView={tableView}
            table={table}
            langtag={langtag}
            rows={rows}
            rowKeys={rowKeys}
            columnKeys={columnKeys}
            columns={columns}
            tables={tables}
          />
        </div>
      );
    }
  };

  componentDidMount = () => {
    // ActionCreator.spinnerOn();
    initHistoryOf(this.props.tables);
    // this.fetchTable(this.props.table.id);
  };

  componentWillReceiveProps = nextProps => {
    if (this.props.table === nextProps.table) {
      // Table ID did not change, check independently for changes of row- and column projection

      if (!f.equals(this.props.projection.rows, nextProps.projection.rows)) {
        this.applyFilters(nextProps.projection);
      }

      if (
        !f.equals(this.props.projection.columns, nextProps.projection.columns)
      ) {
        this.applyColumnVisibility(nextProps.projection);
      }
    }
  };

  // Set visibility of all columns in <coll> to <val>

  applyProjection = (projection = this.props.projection) => {
    this.applyFilters(projection);
    this.applyColumnVisibility(projection);
  };

  setDocumentTitleToTableName = () => {
    const { table = {}, langtag } = this.props;

    if (table) {
      const tableDisplayName = getMultiLangValue(
        langtag,
        "",
        table.displayName
      );
      document.title = tableDisplayName
        ? tableDisplayName + " | " + TableauxConstants.PageTitle
        : TableauxConstants.PageTitle;
    }
  };

  componentDidUpdate = prev => {
    this.setDocumentTitleToTableName();
    // if (prev.table !== this.props.table) {
    //   this.props.resetStoredProjection();
    //   this.fetchTable(this.props.table.id);
    // }
  };

  displaySearchOverlay = (state = true, cb = f.noop) => {
    this.setState({ searchOverlayOpen: state }, () =>
      window.setTimeout(cb, 250)
    );
  };

  changeFilter = (settings = {}, store = true) => {
    const currentTable = this.props.table;
    const hasSlowFilters = f.flow(
      f.get("filters"),
      f.map(f.get("mode")),
      f.any(f.contains(f, [FilterModes.ROW_CONTAINS]))
    );

    if (
      hasSlowFilters(settings) &&
      currentTable.rows.length * currentTable.columns.length >
        BIG_TABLE_THRESHOLD
    ) {
      showDialog({
        type: "question",
        context: "Filter",
        title: i18n.t("filter:large-table.title"),
        message: i18n.t("filter:large-table.message"),
        heading: i18n.t("filter:large-table.header"),
        actions: {
          positive: [
            i18n.t("common:ok"),
            () => this.props.setFilter(settings, store)
          ],
          neutral: [i18n.t("common:cancel"), this.clearFilter]
        }
      });
    } else {
      this.props.setFilter(settings, store);
    }
  };

  onLanguageSwitch = newLangtag => {
    console.log("onLanguageSwitch", newLangtag);
    const history = TableauxRouter.history;
    const url = history.getPath();
    history.navigate(url.replace(this.props.langtag, newLangtag));
  };

  render = () => {
    const {
      tables,
      table,
      columns,
      rows,
      langtag,
      tableId,
      navigate,
      actions,
      filters
    } = this.props;
    const filterActions = f.pick(
      ["setFiltersAndSorting", "deleteFilters"],
      actions
    );
    const columnActions = f.pick(
      ["toggleColumnVisibility", "setColumnsVisible", "hideAllColumns"],
      actions
    );
    const {
      rowsCollection,
      tableFullyLoaded,
      pasteOriginCell,
      pasteOriginCellLang
    } = this.state;
    const overlayOpen = false;

    if (f.isNil(table)) {
      console.error("No table found with id " + tableId);
    }

    // const rows = rowsCollection || currentTable.rows || {};
    // pass concatenated row ids on, so children will re-render on sort, filter, add, etc.
    // without adding event listeners
    if (f.isEmpty(table)) {
      return (
        <div className="initial-loader">
          <Spinner isLoading={true} />
        </div>
      );
    }

    return (
      <div>
        <header>
          <Navigation langtag={langtag} />
          <TableSwitcher
            langtag={langtag}
            currentTable={table}
            tables={tables}
            navigate={navigate}
          />
          <TableSettings langtag={langtag} table={table} />
          <Filter
            langtag={langtag}
            table={table}
            columns={columns}
            currentFilter={this.props.projection.rows}
            filterActions={filterActions}
            filters={filters}
          />
          {table && columns && columns.length > 1 ? (
            <ColumnFilter
              langtag={langtag}
              columns={columns}
              currentFilter={this.props.projection.rows}
            />
          ) : (
            <div />
          )}
          <HistoryButtons tableId={table.id} />
          <div className="header-separator" />
          <Spinner />
          <PageTitle titleKey="pageTitle.tables" />
          <LanguageSwitcher
            langtag={langtag}
            onChange={this.onLanguageSwitch}
          />
          <PasteCellIcon
            clearCellClipboard={this.clearCellClipboard}
            pasteOriginCell={pasteOriginCell}
            pasteOriginCellLang={pasteOriginCellLang}
            tableId={table.id}
          />
        </header>
        {this.renderTableOrSpinner()}
        <JumpSpinner
          isOpen={
            !!this.props.showCellJumpOverlay && !this.state.searchOverlayOpen
          }
        />
        <SearchOverlay isOpen={this.state.searchOverlayOpen} />
      </div>
    );
  };
}

TableView.propTypes = {
  langtag: PropTypes.string.isRequired,
  overlayOpen: PropTypes.bool.isRequired,
  tableId: PropTypes.number,
  projection: PropTypes.object
};

export default reduxActionHoc(TableView, mapStatetoProps);
