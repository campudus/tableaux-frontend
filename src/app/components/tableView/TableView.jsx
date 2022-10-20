import { Redirect, withRouter } from "react-router-dom";
import React, { PureComponent } from "react";
import f from "lodash/fp";
import i18n from "i18next";
import { branch, renderComponent } from "recompose";
import { isTaxonomyTable } from "../taxonomy/taxonomy";

import PropTypes from "prop-types";

import { getTableDisplayName } from "../../helpers/multiLanguage";
import { showDialog } from "../overlay/GenericOverlay";
import { switchLanguageHandler, navigate } from "../Router";
import ColumnFilter from "../header/ColumnFilter";
import Filter from "../header/filter/Filter.jsx";
import GrudHeader from "../GrudHeader";
import HistoryButtons from "../table/undo/HistoryButtons";
import JumpSpinner from "./JumpSpinner";
import PasteCellIcon from "../header/PasteCellIcon";
import SearchOverlay from "./SearchOverlay";
import Spinner from "../header/Spinner.jsx";
import Table from "../table/Table.jsx";
import TableSettings from "../header/tableSettings/TableSettings";
import TableSwitcher from "../header/tableSwitcher/TableSwitcher.jsx";
import TableauxConstants, {
  ColumnKinds,
  FilterModes,
  RowIdColumn
} from "../../constants/TableauxConstants";
import applyFiltersAndVisibility from "./applyFiltersAndVisibility";
import reduxActionHoc from "../../helpers/reduxActionHoc";
import store from "../../redux/store";

const BIG_TABLE_THRESHOLD = 10000; // Threshold to decide when a table is so big we might not want to search it
const mapStatetoProps = (state, props) => {
  const { tableId } = props;
  const tables = f.get("tables.data", state);
  const table = tables[tableId];
  const columns = f.get(`columns.${tableId}.data`, state);
  const rows = f.get(`rows.${tableId}.data`, state);
  const finishedLoading = f.get(`rows.${tableId}.finishedLoading`, state);
  const tableView = f.get("tableView", state);
  const hasStatusColumn = !!f.find({ kind: ColumnKinds.status }, columns);
  const {
    startedGeneratingDisplayValues,
    visibleColumns,
    filters,
    sorting,
    columnOrdering,
    rerenderTable
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
    columnOrdering,
    hasStatusColumn,
    rerenderTable
  };
};

@applyFiltersAndVisibility
@withRouter
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

  clearCellClipboard = () => {
    this.props.actions.copyCellValue({});
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
      finishedLoading,
      visibleColumnOrdering,
      hasStatusColumn,
      rerenderTable
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
            navigate={this.onNavigate}
            finishedLoading={finishedLoading}
            visibleColumnOrdering={visibleColumnOrdering}
            hasStatusColumn={hasStatusColumn}
            rerenderTable={rerenderTable}
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
    const { history } = this.props;
    switchLanguageHandler(history, newLangtag);
  };

  onNavigate = path => {
    const { history } = this.props;
    navigate(history, path);
  };

  getCellUrl = () => {
    const { langtag, table } = this.props;
    const {
      selectedCell: {
        selectedCell: { rowId, columnId }
      }
    } = store.getState();

    return (
      `/${langtag}` +
      `/tables/${table.id}` +
      (columnId ? `/columns/${columnId}` : "") +
      (rowId ? `/rows/${rowId}` : "")
    );
  };

  render = () => {
    const {
      tables,
      table,
      columns,
      langtag,
      tableId,
      actions,
      allDisplayValues,
      filtering,
      tableView,
      columnOrdering
    } = this.props;
    const columnActions = f.pick(
      [
        "toggleColumnVisibility",
        "setColumnsVisible",
        "hideAllColumns",
        "setColumnOrdering"
      ],
      actions
    );
    const copySource = f.propOr({}, "copySource", tableView);
    const pasteOriginCell = copySource.cell;
    const pasteOriginCellLang = copySource.langtag;

    // const rows = rowsCollection || currentTable.rows || {};
    // pass concatenated row ids on, so children will re-render on sort, filter, add, etc.
    // without adding event listeners
    if (f.isEmpty(table) || f.isEmpty(columns)) {
      return (
        <div className="initial-loader">
          <Spinner isLoading={true} />
        </div>
      );
    }

    return (
      <div>
        <GrudHeader
          langtag={langtag}
          handleLanguageSwitch={this.onLanguageSwitch}
          pageTitleOrKey="pageTitle.tables"
        >
          {isTaxonomyTable(table) ? (
            <div className="hfill" />
          ) : (
            <>
              <TableSwitcher
                langtag={langtag}
                currentTable={table}
                tables={tables}
                navigate={this.onNavigate}
              />
              <TableSettings
                langtag={langtag}
                table={table}
                actions={actions}
              />
              <Filter
                langtag={langtag}
                table={table}
                columns={[RowIdColumn, ...columns]}
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
                  columnOrdering={columnOrdering}
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
              <PasteCellIcon
                clearCellClipboard={this.clearCellClipboard}
                pasteOriginCell={pasteOriginCell}
                pasteOriginCellLang={pasteOriginCellLang}
                tableId={table.id}
              />
            </>
          )}
        </GrudHeader>
        {this.renderTableOrSpinner()}
        <JumpSpinner isOpen={!!this.props.showCellJumpOverlay && !filtering} />
        <SearchOverlay isOpen={filtering} />
        <Redirect to={this.getCellUrl()} />
      </div>
    );
  };
}

const EmptyTableView = withRouter(({ langtag, history }) => {
  const handleLanguageSwitch = React.useCallback(langtag =>
    switchLanguageHandler(history, langtag)
  );

  return (
    <>
      <GrudHeader
        langtag={langtag}
        handleLanguageSwitch={handleLanguageSwitch}
        pageTitleOrKey="pageTitle.tables"
      />
      <div className="initial-loader">
        <div className="centered-user-message">
          {i18n.t("table:no-tables-found")}
        </div>
      </div>
      <Redirect to={`/${langtag}/tables`} />
    </>
  );
});

TableView.propTypes = {
  langtag: PropTypes.string.isRequired,
  overlayOpen: PropTypes.bool.isRequired,
  tableId: PropTypes.number,
  projection: PropTypes.object
};

export default branch(
  props => f.isNil(props.tableId),
  renderComponent(EmptyTableView)
)(reduxActionHoc(TableView, mapStatetoProps));
