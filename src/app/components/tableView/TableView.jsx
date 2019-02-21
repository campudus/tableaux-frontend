import React, { PureComponent } from "react";
import PropTypes from "prop-types";
import Table from "../table/Table.jsx";
import LanguageSwitcher from "../header/LanguageSwitcher.jsx";
import TableSwitcher from "../header/tableSwitcher/TableSwitcher.jsx";
import f from "lodash/fp";
import TableauxConstants, {
  FilterModes
} from "../../constants/TableauxConstants";
import Filter from "../header/filter/Filter.jsx";
import Navigation from "../header/Navigation.jsx";
import PageTitle from "../header/PageTitle.jsx";
import Spinner from "../header/Spinner.jsx";
import TableSettings from "../header/tableSettings/TableSettings";
import ColumnFilter from "../header/ColumnFilter";
import i18n from "i18next";
import TableauxRouter from "../../router/router";
import pasteCellValue from "../cells/cellCopyHelper";
import JumpSpinner from "./JumpSpinner";
import applyFiltersAndVisibility from "./applyFiltersAndVisibility";
import PasteCellIcon from "../header/PasteCellIcon";
import { showDialog } from "../overlay/GenericOverlay";
import SearchOverlay from "./SearchOverlay";
import HistoryButtons from "../table/undo/HistoryButtons";
import { initHistoryOf } from "../table/undo/tableHistory";
import { getMultiLangValue } from "../../helpers/multiLanguage";
// import canFocusCell from "./canFocusCell";
import reduxActionHoc from "../../helpers/reduxActionHoc";

const BIG_TABLE_THRESHOLD = 10000; // Threshold to decide when a table is so big we might not want to search it
const mapStatetoProps = (state, props) => {
  const { tableId } = props;
  const tables = f.get("tables.data", state);
  const table = tables[tableId];
  const columns = f.get(`columns.${tableId}.data`, state);
  const rows = f.get(`rows.${tableId}.data`, state);
  const tableView = f.get("tableView", state);
  const {
    startedGeneratingDisplayValues,
    visibleRows,
    visibleColumns,
    filters,
    sorting,
    searchOverlayOpen
  } = tableView;
  const allDisplayValues = f.get(["displayValues"], tableView);

  if (table) {
    TableauxConstants.initLangtags(table.langtags);
  }
  return {
    table,
    columns,
    rows,
    tables,
    startedGeneratingDisplayValues,
    displayValues: f.defaultTo([], f.prop(tableId, allDisplayValues)),
    allDisplayValues,
    tableView,
    visibleRows,
    visibleColumns,
    filters,
    sorting,
    searchOverlayOpen
  };
};

@applyFiltersAndVisibility
// @canFocusCell
class TableView extends PureComponent {
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
      langtag,
      table,
      actions,
      canRenderTable,
      tableView,
      visibleColumns,
      visibleRows
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
            visibleColumns={visibleColumns}
            visibleRows={visibleRows}
            actions={actions}
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

  // Set visibility of all columns in <coll> to <val>

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
    TableauxRouter.switchLanguageHandler(newLangtag);
  };

  render = () => {
    const {
      tables,
      table,
      columns,
      langtag,
      tableId,
      navigate,
      actions,
      allDisplayValues,
      rows,
      filtering
    } = this.props;
    const columnActions = f.pick(
      ["toggleColumnVisibility", "setColumnsVisible", "hideAllColumns"],
      actions
    );
    const {
      // rowsCollection,
      // tableFullyLoaded,
      pasteOriginCell,
      pasteOriginCellLang
    } = this.state;

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
            currentFilter={{
              filters: this.props.tableView.filters,
              sorting: this.props.tableView.sorting
            }}
            setRowFilter={this.props.actions.setFiltersAndSorting}
            actions={actions}
          />
          {table && columns && columns.length > 1 ? (
            <ColumnFilter
              langtag={langtag}
              columns={columns}
              tableId={tableId}
              columnActions={columnActions}
            />
          ) : (
            <div />
          )}
          <HistoryButtons tableId={table.id} />
          <div className="header-separator" />
          <Spinner isLoading={f.isEmpty(allDisplayValues)} />
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
        <SearchOverlay isOpen={filtering} />
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
