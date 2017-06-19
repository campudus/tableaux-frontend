import React, {Component, PropTypes} from "react";
import _ from "lodash";
import ActionCreator from "../../../actions/ActionCreator";
import "react-virtualized/styles.css";
import {AutoSizer, List} from "react-virtualized";
import {translate} from "react-i18next";
import i18n from "i18next";
import {ActionTypes, DefaultLangtag, Directions, FilterModes} from "../../../constants/TableauxConstants";
import {either, maybe} from "../../../helpers/monads";
import * as f from "lodash/fp";
import SearchFunctions from "../../../helpers/searchFunctions";
import KeyboardShortcutsHelper from "../../../helpers/KeyboardShortcutsHelper";
import apiUrl, {openInNewTab} from "../../../helpers/apiUrl";
import withAbortableXhrRequests from "../../helperComponents/withAbortableXhrRequests";
import OverlayHeadRowIdentificator from "../../overlay/OverlayHeadRowIdentificator";
import Header from "../../overlay/Header";
import Dispatcher from "../../../dispatcher/Dispatcher";
import {loadAndOpenEntityView} from "../../overlay/EntityViewOverlay";
import SvgIcon from "../../helperComponents/SvgIcon";
import ReactDOM from "react-dom";
import SearchBar from "./LinkOverlaySearchBar";
import DragSortList from "./DragSortList";
import {changeCell} from "../../../models/Tables";
import LinkItem from "./LinkItem";
import Spinner from "../../header/Spinner";

const MAIN_BUTTON = 0;
const LINK_BUTTON = 1;
const LINKED_ITEMS = 0;
const UNLINKED_ITEMS = 1;

@translate(["table"])
@withAbortableXhrRequests
class LinkOverlay extends Component {

  constructor(props) {
    super(props);
    this.allRowResults = {};
    this.state = {
      rowResults: {},
      loading: true,
      filterMode: FilterModes.CONTAINS,
      filterModePopupOpen: false,
      popupOpen: false,
      selectedId: {
        linked: 0,
        unlinked: 0
      },
      selectedMode: 0,
      activeBox: UNLINKED_ITEMS
    };
  }

  static propTypes = {
    cell: PropTypes.object.isRequired,
    langtag: PropTypes.string.isRequired,
    tableId: PropTypes.number
  };

  componentDidMount = () => { // why is componentWillMount never called?
    Dispatcher.on(ActionTypes.FILTER_LINKS, this.setFilterMode);
    Dispatcher.on(ActionTypes.PASS_ON_KEYSTROKES, this.handleMyKeys);
    Dispatcher.on(ActionTypes.BROADCAST_DATA_CHANGE, this.updateLinkValues);
  };

  componentWillUnmount = () => {
    Dispatcher.off(ActionTypes.FILTER_LINKS, this.setFilterMode);
    Dispatcher.off(ActionTypes.PASS_ON_KEYSTROKES, this.handleMyKeys);
    Dispatcher.off(ActionTypes.BROADCAST_DATA_CHANGE, this.updateLinkValues);
  };

  handleMyKeys = ({id, event}) => {
    if (id === this.props.id) {
      KeyboardShortcutsHelper.onKeyboardShortcut(this.getKeyboardShortcuts)(event);
    }
  };

  getKeyboardShortcuts = () => {
    const {selectedMode, activeBox} = this.state;
    const rows = f.get((activeBox === UNLINKED_ITEMS) ? "unlinked" : "linked", this.state.rowResults);
    const selectNext = (dir) => {
      const selectedId = this.getSelectedId();
      const nextIdx = (selectedId + ((dir === Directions.UP) ? -1 : 1) + rows.length) % rows.length;
      this.setSelectedId(nextIdx);
    };
    return {
      enter: event => {
        const {activeBox, rowResults} = this.state;
        const activeBoxIDString = (activeBox === LINKED_ITEMS) ? "linked" : "unlinked";
        const row = f.get([activeBoxIDString, this.getSelectedId()], rowResults);
        if (selectedMode === MAIN_BUTTON) {
          this.addLinkValue(activeBox === LINKED_ITEMS, row, event);
        } else {
          const {cell} = this.props;
          const target = {
            tables: cell.tables,
            tableId: cell.column.toTable,
            rowId: row.id
          };
          loadAndOpenEntityView(target, this.props.langtag);
        }
      },
      escape: event => {
        event.preventDefault();
        event.stopPropagation();
        ActionCreator.closeOverlay();
      },
      up: event => {
        event.preventDefault();
        event.stopPropagation();
        selectNext(Directions.UP);
        if (this.state.activeBox === LINKED_ITEMS && event.shiftKey) {
          const selectedId = this.getSelectedId();
          if (selectedId > 0) {
            this.swapLinkedItems(selectedId - 1, selectedId);
          }
        }
      },
      down: event => {
        event.preventDefault();
        event.stopPropagation();
        selectNext(Directions.DOWN);
        if (this.state.activeBox === LINKED_ITEMS && event.shiftKey) {
          const selectedId = this.getSelectedId();
          if (selectedId < f.size(this.state.rowResults.linked)) {
            this.swapLinkedItems(selectedId, selectedId + 1);
          }
        }
      },
      right: event => {
        event.preventDefault();
        event.stopPropagation();
        this.setState({selectedMode: LINK_BUTTON});
      },
      left: event => {
        event.preventDefault();
        event.stopPropagation();
        this.setState({selectedMode: MAIN_BUTTON});
      },
      tab: event => {
        event.preventDefault();
        event.stopPropagation();
        if (event.shiftKey) {
          this.setState({selectedMode: (selectedMode + 1) % 2});
        } else {
          this.setState({activeBox: (activeBox + 1) % 2});
        }
      }
    };
  };

  setSelectedId = id => {
    const activeBox = (this.state.activeBox === LINKED_ITEMS) ? "linked" : "unlinked";
    const idToSet = f.clamp(0, f.size(f.get(activeBox, this.state.rowResults)) - 1, id);
    const andFocusIfLinked = () => {
      if (activeBox !== "linked") {
        return;
      }
      const domNode = ReactDOM.findDOMNode(f.get(this.state.selectedId.linked, this.elements));
      const focused = (f.get("tagName", document.activeElement) === "INPUT") ? document.activeElement : null;
      maybe(domNode).method("focus");   // scroll link item into view
      maybe(focused).method("focus");   // restore search box focus
    };
    this.setState({selectedId: f.assoc(activeBox, idToSet, this.state.selectedId)}, andFocusIfLinked);
  };

  getSelectedId = () => {
    const activeBox = (this.state.activeBox === LINKED_ITEMS) ? "linked" : "unlinked";
    return f.get(activeBox, this.state.selectedId);
  };

  componentWillMount = () => {
    const toTableId = this.props.cell.column.toTable;
    const toTable = this.props.cell.tables.get(toTableId);
    const {cell} = this.props;

    // Data already fetched, show it instantly and update it in the background
    if (toTable.rows.length > 0) {
      this.setRowResult(toTable.rows);
    }

    // TODO: Page me!

    const fetchColumns = new Promise(
      (resolve, reject) => {
        const colXhr = toTable.columns.fetch({
          success: resolve,
          error: reject
        });
        this.props.addAbortableXhrRequest(colXhr);
      }
    );

    const fetchForeignRows = new Promise(
      (resolve, reject) => {
        const rowXhr = toTable.rows.fetch({
          url: apiUrl(`/tables/${cell.tableId}/columns/${cell.column.id}/rows/${cell.row.id}/foreignRows`),
          success: () => {
            this.setRowResult(
              f.map(row => ({
                id: row.id,
                value: row.cells.at(0).value,
                displayValue: row.cells.at(0).displayValue
              }), toTable.rows.models),
              true);
            resolve();
          },
          error: reject
        });
        this.props.addAbortableXhrRequest(rowXhr);
      }
    );

    fetchColumns
      .then(fetchForeignRows);
  };

  getCurrentSearchValue = () => {
    const {filterValue, filterMode} = this.state;
    return {
      filterMode,
      filterValue
    };
  };

  onSearch = (event) => {
    this.setState({
      rowResults: this.filterRowsBySearch(this.getCurrentSearchValue()),
      selectedId: {
        linked: this.state.selectedId.linked,
        unlinked: 0
      },
      activeBox: UNLINKED_ITEMS
    });
  };

  // we set the row result depending if a search value is set
  setRowResult = (rowResult, fromServer) => {
    // just set the models, because we filter it later which also returns the models.
    const {cell} = this.props;
    const linkedRows = f.map(
      ([cellValue, cellDisplayValue]) => ({
        id: cellValue.id,
        value: cellValue.value,
        displayValue: cellDisplayValue
      }),
      f.zip(cell.value, cell.displayValue)
    );
    this.allRowResults = [...linkedRows, ...rowResult];
    // we always rebuild the row names, also to prevent wrong display names when switching languages
    this.setState({
      // we show all the rows
      rowResults: this.filterRowsBySearch(this.getCurrentSearchValue()),
      loading: false
    });
  };

  updateLinkValues = ({cell, row}) => {
    const thisCell = this.props.cell;
    if (cell.column.id !== thisCell.column.toColumn.id || cell.tableId !== thisCell.column.toTable) {
      return;
    }
    const linkedRows = f.map(f.get("id"), thisCell.value);
    if (!f.contains(row.id, linkedRows)) {
      return;
    }
    const oldValueIdx = f.findIndex(f.matchesProperty("id", row.id), this.allRowResults);
    const newLink = f.assoc("id", row.id, f.pick(["value", "displayValue"], cell));
    this.allRowResults = f.assoc(oldValueIdx, newLink, this.allRowResults);
    this.setState({
      rowResults: this.filterRowsBySearch(this.getCurrentSearchValue())
    });
  };

  setFilterMode = ({filterMode = FilterModes.CONTAINS, filterValue = ""}) => {
    this.setState(
      {
        filterMode,
        filterValue
      },
      () => this.onSearch());
  };

  filterRowsBySearch = (searchParams) => {
    const {langtag} = this.props;
    const {filterValue, filterMode} = searchParams;
    const searchFunction = SearchFunctions[filterMode];
    const {allRowResults} = this;
    const linkPosition = f.reduce(
      f.merge, {}, this.props.cell.value.map((row, idx) => ({[row.id]: idx}))
    );
    const linkedRows = f.compose(
      f.sortBy(link => f.get(link.id, linkPosition)),
      f.filter(this.isRowLinked)
    )(allRowResults);
    const unlinkedRows = f.reject(this.isRowLinked, allRowResults);
    const byDisplayValues = f.compose(
      searchFunction(filterValue),
      f.get(["displayValue", langtag])
    );
    return {
      linked: linkedRows,
      unlinked: (filterValue !== "") ? f.filter(byDisplayValues, unlinkedRows) : unlinkedRows
    };
  };

  addLinkValue = (isAlreadyLinked, link, event) => {
    maybe(event).method("preventDefault");
    const cell = this.props.cell;
    const withoutLink = f.remove(f.matchesProperty("id", link.id));
    const links = (isAlreadyLinked)
      ? withoutLink(cell.value)
      : [...cell.value, link];

    if (isAlreadyLinked && f.get(["constraint", "deleteCascade"], cell.column)) {
      this.allRowResults = withoutLink(this.allRowResults);
    }

    ActionCreator.changeCell(cell, links);
    this.setState({rowResults: this.filterRowsBySearch(this.getCurrentSearchValue())});
  };

  isRowLinked = (row) => {
    const currentCellValue = either(this.props.cell)
      .map(f.prop(["value"]))
      .getOrElse(null);
    return !!_.find(currentCellValue, link => f.get("id", link) === f.get("id", row));
  };

  setActiveBox = (val) => (e) => {
    this.setState({activeBox: val});
    e.stopPropagation();
    this.background.focus();
  };

  renderListItem = ({isLinked}) => ({key, index, style = {}}) => {
    const {selectedMode, activeBox} = this.state;
    const rowResults = f.get((isLinked) ? "linked" : "unlinked", this.state.rowResults);
    const row = rowResults[index];

    if (_.isEmpty(rowResults) || _.isEmpty(row)) {
      return null;
    }

    const isSelected = this.getSelectedId() === index && activeBox === ((isLinked) ? LINKED_ITEMS : UNLINKED_ITEMS);
    const {langtag, cell} = this.props;

    const refIfLinked = el => {
      if (isLinked) {
        this.elements = f.assoc(index, el, this.elements || {});
      }
    };

    const mouseOverBoxHandler = val => e => {
      this.setState({
        selectedMode: val,
        activeBox: (isLinked) ? LINKED_ITEMS : UNLINKED_ITEMS
      });
      e.stopPropagation();
      this.background.focus();
    };

    const mouseOverItemHandler = index => e => {
      this.setSelectedId(index);
      this.setState({activeBox: (isLinked) ? LINKED_ITEMS : UNLINKED_ITEMS});
      e.stopPropagation();
      this.background.focus();
    };

    return (
      <LinkItem
        key={key}
        mouseOverHandler={{
          box: mouseOverBoxHandler,
          item: mouseOverItemHandler(index)
        }}
        refIfLinked={refIfLinked}
        clickHandler={this.addLinkValue}
        isLinked={isLinked}
        isSelected={isSelected}
        row={row}
        cell={cell}
        langtag={langtag}
        style={style}
        selectedMode={selectedMode}
      />
    );
  };

  noRowsRenderer = () => {
    const {t} = this.props;
    return (
      <div className="empty">
        {this.getCurrentSearchValue().length > 0 ? t("search_no_results") : t("overlay_no_rows_in_table")}
      </div>);
  };

  swapLinkedItems = (a, b) => {
    const linkedItems = f.get(["rowResults", "linked"], this.state) || [];
    const {cell} = this.props;
    const rearranged = f.compose(
      f.assoc(a, f.get(b, linkedItems)),
      f.assoc(b, f.get(a, linkedItems)),
    )(linkedItems);

    changeCell({
      cell,
      value: rearranged
    })
      .catch(
        error => {
          console.error("Error changing cell, restoring original data:", error);
          this.setState({rowResults: f.assoc("linked", linkedItems, this.state.rowResults)});
        });
    this.setState({rowResults: f.assoc("linked", rearranged, this.state.rowResults)});
  };

  renderRowCreator = () => {
    const {cell, cell: {column: {displayName, toTable, constraint}}, langtag} = this.props;
    const addAndLinkRow = () => {
      const linkNewRow = row => {
        const link = {
          id: row.id,
          value: null,
          displayValue: {}
        };
        this.allRowResults = [...this.allRowResults, link];
        this.addLinkValue(false, link);

        loadAndOpenEntityView({tables: cell.tables, tableId: toTable, rowId: row.id}, langtag);
      };
      ActionCreator.addRow(toTable, linkNewRow);
    };

    const linkTableName = displayName[langtag] || displayName[DefaultLangtag] || "";
    const linked = f.size(this.state.rowResults.linked);
    const cardinalityTo = f.get(["cardinality", "to"], constraint) || 0;
    const allowed = (cardinalityTo > 0) ? cardinalityTo : Number.POSITIVE_INFINITY;

    return (linked < allowed)
      ? (
        <div className="row-creator-button" onClick={addAndLinkRow}>
          <SvgIcon icon="plus" containerClasses="color-primary" />
          <span>{i18n.t("table:link-overlay-add-new-row", {tableName: linkTableName})}</span>
        </div>
      )
      : null;
  };

  render = () => {
    const {rowResults, loading} = this.state;
    const {cell, cell: {column}, cell: {column: {displayName}}, langtag} = this.props;
    const targetTable = {
      tableId: column.toTable,
      langtag
    };

    const unlinkedRows = (loading)
      ? <Spinner isLoading={true} />
      : <AutoSizer>
        {({width, height}) => <List
          ref="OverlayScroll"
          width={width}
          height={height}
          rowCount={rowResults.unlinked.length || 0}
          rowHeight={40}
          rowRenderer={this.renderListItem({isLinked: false})}
          scrollToIndex={this.state.selectedId.unlinked}
          noRowsRenderer={this.noRowsRenderer}
        />}
      </AutoSizer>;

    // because keeping track of multiple partial localisation strings gets more tiresome...
    const linkEmptyLines = i18n.t("table:link-overlay-empty").split(".");

    const linkedRows = (f.isEmpty(f.get("linked", rowResults)) && !loading)
      ? (
        <div className="link-list empty-info">
          <i className="fa fa-chain-broken" />
          <div className="text">
            <span>
              {linkEmptyLines[0]}.
            </span>
            <span>
              {linkEmptyLines[1]}.
            </span>
          </div>
        </div>
      )
      : (
        <DragSortList renderListItem={this.renderListItem({isLinked: true})}
                      items={f.defaultTo([])(rowResults.linked).map(
                        (row, index) => {
                          return {
                            index,
                            id: row.id
                          };
                        }
                      )}
                      swapItems={this.swapLinkedItems}
        />
      );

    return (
      <div onKeyDown={KeyboardShortcutsHelper.onKeyboardShortcut(this.getKeyboardShortcuts)}
           className="link-overlay"
           tabIndex={1}
           onMouseOver={e => e.target.focus()}
           ref={el => {
             this.background = el;
           }}
      >
        <div className="linked-items" onMouseEnter={this.setActiveBox(LINKED_ITEMS)}>
          <span className="items-title">
            <span>{i18n.t("table:link-overlay-items-title")}
              {(cell.tables.get(cell.column.toTable).hidden)
                ? displayName[langtag] || displayName[DefaultLangtag]
                : (
                  <a className="table-link" href="#" onClick={() => openInNewTab(targetTable)}>
                    {displayName[langtag] || displayName[DefaultLangtag]}
                  </a>
                )
              }
            </span>
          </span>
          {linkedRows}
        </div>
        <div className="unlinked-items" onMouseEnter={this.setActiveBox(UNLINKED_ITEMS)}>
          {unlinkedRows}
        </div>
        {this.renderRowCreator()}
      </div>
    );
  }
}

export const openLinkOverlay = (cell, langtag) => {
  const table = cell.tables.get(cell.tableId);
  const tableName = table.displayName[langtag] || table.displayName[DefaultLangtag];
  const overlayContent = <LinkOverlay cell={cell} langtag={langtag} />;
  ActionCreator.openOverlay({
    head: <Header context={tableName}
                  title={<OverlayHeadRowIdentificator cell={cell} langtag={langtag} />}
                  components={<SearchBar langtag={langtag} />}
    />,
    body: overlayContent,
    type: "full-height",
    classes: "link-overlay"
  });
};

export default LinkOverlay;
