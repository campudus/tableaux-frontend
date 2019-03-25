import React, { PureComponent } from "react";
import f from "lodash/fp";
import i18n from "i18next";

import PropTypes from "prop-types";

import { getTableDisplayName } from "../../helpers/multiLanguage";
import { showDialog } from "../overlay/GenericOverlay";
import ColumnFilter from "../header/ColumnFilter";
import { ConnectionStatus } from "../header/ConnectionStatus";
import Filter from "../header/filter/Filter.jsx";
import HistoryButtons from "../table/undo/HistoryButtons";
import JumpSpinner from "./JumpSpinner";
import LanguageSwitcher from "../header/LanguageSwitcher.jsx";
import Navigation from "../header/Navigation.jsx";
import PageTitle from "../header/PageTitle.jsx";
import PasteCellIcon from "../header/PasteCellIcon";
import SearchOverlay from "./SearchOverlay";
import Spinner from "../header/Spinner.jsx";
import Table from "../table/Table.jsx";
import TableSettings from "../header/tableSettings/TableSettings";
import TableSwitcher from "../header/tableSwitcher/TableSwitcher.jsx";
import TableauxConstants, {
  FilterModes
} from "../../constants/TableauxConstants";
import TableauxRouter from "../../router/router";
import applyFiltersAndVisibility from "./applyFiltersAndVisibility";
import pasteCellValue from "../cells/cellCopyHelper";
import reduxActionHoc from "../../helpers/reduxActionHoc";

const BIG_TABLE_THRESHOLD = 10000; // Threshold to decide when a table is so big we might not want to search it
const mapStatetoProps = (state, props) => {
  const { tableId } = props;
  const tables = f.get("tables.data", state);
  const table = tables[tableId];
  const columns = f.get(`columns.${tableId}.data`, state);
  const rows = f.get(`rows.${tableId}.data`, state);
  const finishedLoading = f.get(`rows.${tableId}.finishedLoading`, state);
  const tableView = f.get("tableView", state);
  const grudStatus = f.get("grudStatus", state);
  const {
    startedGeneratingDisplayValues,
    visibleColumns,
    filters,
    sorting
  } = tableView;
  const allDisplayValues = f.get(["tableView", "displayValues"], state);

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
    visibleColumns,
    filters,
    sorting,
    finishedLoading,
    grudStatus
  };
};

@applyFiltersAndVisibility
class TableView extends PureComponent {
  constructor(props) {
    super(props);

    this.state = {
      initialLoading: false,
      rowsCollection: null,
      tableFullyLoaded: true
    };
  }

  setCopyOrigin = ({ cell, langtag }) => {
    this.props.actions.copyCellValue({
      cell,
      langtag
    });
  };

  pasteCellTo = ({ cell, langtag }) => {
    const { copySource } = f.propOr({}, "tableview.copySource", this.props);
    const src = copySource.cell;
    const srcLang = copySource.langtag;
    pasteCellValue(src, srcLang, cell, langtag);
  };

  clearCellClipboard = () => {
    this.props.actions.copyCellValue({});
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
      visibleRows,
      navigate,
      finishedLoading
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
            navigate={navigate}
            finishedLoading={finishedLoading}
          />
        </div>
      );
    }
  };

  setDocumentTitleToTableName = () => {
    const { table = {}, langtag } = this.props;

    if (table) {
      const tableDisplayName = getTableDisplayName(table, langtag);
      document.title = tableDisplayName
        ? tableDisplayName + " | " + TableauxConstants.PageTitle
        : TableauxConstants.PageTitle;
    }
  };

  componentDidUpdate = () => {
    this.setDocumentTitleToTableName();
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
      filtering,
      tableView,
      grudStatus: { connectedToBackend }
    } = this.props;
    const columnActions = f.pick(
      ["toggleColumnVisibility", "setColumnsVisible", "hideAllColumns"],
      actions
    );
    const copySource = f.propOr({}, "copySource", tableView);
    const pasteOriginCell = copySource.cell;
    const pasteOriginCellLang = copySource.langtag;

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
          <TableSettings langtag={langtag} table={table} actions={actions} />
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
          <HistoryButtons
            tableId={tableId}
            actions={actions}
            tableView={tableView}
          />
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
          <ConnectionStatus isConnected={connectedToBackend} />
        </header>
        {this.renderTableOrSpinner()}
        <JumpSpinner isOpen={!!this.props.showCellJumpOverlay} />
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
