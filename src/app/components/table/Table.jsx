import { Portal } from "react-portal";
import React, { PureComponent } from "react";
import ReactDOM from "react-dom";
import f from "lodash/fp";
import i18n from "i18next";

import PropTypes from "prop-types";

import {
  doto,
  maybe,
  preventDefault,
  stopPropagation
} from "../../helpers/functools";
import RowContextMenu from "../contextMenu/RowContextMenu";
import VirtualTable from "./VirtualTable";
import { isTaxonomyTable } from "../taxonomy/taxonomy";
import TaxonomyTable from "../taxonomy/TaxonomyTable";
import { buildClassName } from "../../helpers/buildClassName";

class Table extends PureComponent {
  /**
   * This is an anti-pattern on purpose
   * Don't change this, its more performant than using this.state !
   */
  constructor(props) {
    super(props);
    this.headerDOMElement = null;
    this.tableDOMNode = null;
    this.tableRowsDom = null; // scrolling rows container

    this.state = {
      windowHeight: window.innerHeight,
      scrolledHorizontal: 0,
      rowContextMenu: null,
      showScrollToLeftButton: false
    };
  }

  componentWillMount() {
    window.addEventListener("resize", this.windowResize);
  }

  componentWillUnmount() {
    window.removeEventListener("resize", this.windowResize);
  }

  // Don't put this into state, deliberate antipattern to prevent unnecessary rerenders
  selectedCellExpandedRow = null;

  onMouseDownHandler = e => {
    // We don't prevent mouse down behaviour when focus is outside of table. This fixes the issue to close select boxes
    // in the header
    if (
      maybe(this.tableDOMNode)
        .exec("contains", document.activeElement)
        .getOrElse(false)
    ) {
      // deselect a cell when clicking column. Right now we cannot deselect when clicking in the white area because we
      // can't differentiate between clicking the scrollbar or content
      if (
        maybe(this.headerDOMElement)
          .exec("contains", e.target)
          .getOrElse(false)
      ) {
        e.preventDefault();
      }

      /*
       Important: prevents losing the focus of a cell when clicking something.
       When a child component inside of the Table needs focus attach a "onMouseDown" event to it and
       call "event.stopPropagation()". This prevents calling this function and enables the standard browser behaviour
       */
    }
  };

  windowResize = () => {
    this.setState({ windowHeight: window.innerHeight });
  };

  findAndStoreTableDiv = virtualDOMNode => {
    // The react ref is not enough for this use case
    // eslint-disable-next-line react/no-find-dom-node
    this.tableDOMNode = ReactDOM.findDOMNode(virtualDOMNode);
  };

  noRowsInfo = () => {
    const { rows, finishedLoading, tableView } = this.props;
    const result =
      finishedLoading && f.isEmpty(rows) ? (
        <Portal isOpened>
          <div className="table-has-no-rows">
            {f.isEmpty(tableView.filters)
              ? i18n.t("table:has-no-rows")
              : i18n.t("table:search_no_results")}
          </div>
        </Portal>
      ) : null;

    return result;
  };

  showRowContextMenu = openAnnotations => ({ langtag, cell }) => event => {
    const { pageX, pageY } = event;
    const { actions, rows, tableView } = this.props;
    this.setState({
      rowContextMenu: {
        x: pageX,
        y: pageY,
        row: cell.row,
        table: cell.table,
        actions,
        langtag,
        cell,
        rows,
        openAnnotations,
        copySource: f.propOr({}, "copySource", tableView)
      }
    });
  };

  hideRowContextMenu = event => {
    stopPropagation(event);
    preventDefault(event);
    this.setState({ rowContextMenu: null });
  };

  setSelectedCellExpandedRow = langtag => {
    this.selectedCellExpandedRow = langtag;
  };

  getSelectedCellExpandedRow = () => this.selectedCellExpandedRow;

  render() {
    const {
      actions,
      columns,
      rows,
      tables,
      table,
      langtag,
      tableView,
      visibleColumns,
      navigate,
      finishedLoading,
      visibleColumnOrdering,
      hasStatusColumn,
      rerenderTable,
      renderNewRowButton
    } = this.props;
    const { rowContextMenu } = this.state;
    const rowIds = f.map("id", rows);

    const displayValues = doto(
      tableView,
      f.prop(["displayValues", table.id]),
      allDisplayValues =>
        rowIds.map(id => f.find(f.propEq("id", id), allDisplayValues)),
      f.map("values")
    );

    const isTaxonomy = table && isTaxonomyTable(table);
    const isSettings = table && table.type === "settings";
    const tableClass = buildClassName("tableaux-table", {
      taxonomy: isTaxonomy,
      settings: isSettings,
      generic: !isTaxonomy && !isSettings
    });

    return (
      <section
        id="table-wrapper"
        tabIndex="-1"
        onMouseDown={this.onMouseDownHandler}
      >
        <div className={tableClass}>
          {isTaxonomy ? (
            <TaxonomyTable tableId={table.id} langtag={langtag} />
          ) : (
            <VirtualTable
              key={`virtual-table-${f.get("id", table)}`}
              actions={actions}
              columns={columns}
              visibleColumns={visibleColumns}
              ref={this.findAndStoreTableDiv}
              rows={rows}
              tableView={tableView}
              displayValues={displayValues}
              table={table}
              tables={tables}
              langtag={langtag}
              expandedRowIds={tableView.expandedRowIds}
              fullyLoaded={this.props.fullyLoaded}
              openCellContextMenu={this.showRowContextMenu}
              closeCellContextMenu={this.hideRowContextMenu}
              navigate={navigate}
              finishedLoading={finishedLoading}
              selectedCellExpandedRow={this.state.selectedCellExpandedRow}
              setSelectedCellExpandedRow={this.setSelectedCellExpandedRow}
              getSelectedCellExpandedRow={this.getSelectedCellExpandedRow}
              visibleColumnOrdering={visibleColumnOrdering}
              hasStatusColumn={hasStatusColumn}
              rerenderTable={rerenderTable}
              renderNewRowButton={renderNewRowButton}
            />
          )}
        </div>
        {this.noRowsInfo()}
        {rowContextMenu ? (
          <RowContextMenu
            {...rowContextMenu}
            onClickOutside={this.hideRowContextMenu}
            action={actions}
          />
        ) : null}
      </section>
    );
  }
}

Table.propTypes = {
  actions: PropTypes.object.isRequired,
  tableView: PropTypes.object.isRequired,
  langtag: PropTypes.string.isRequired,
  rows: PropTypes.array,
  columns: PropTypes.array
};

export default Table;
