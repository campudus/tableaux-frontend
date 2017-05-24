import React, {Component, PropTypes} from "react";
import _ from "lodash";
import ActionCreator from "../../../actions/ActionCreator";
import "react-virtualized/styles.css";
import {AutoSizer, List} from "react-virtualized";
import {translate} from "react-i18next";
import i18n from "i18next";
import {ActionTypes, Directions, FallbackLanguage, FilterModes} from "../../../constants/TableauxConstants";
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
  };

  componentWillUnmount = () => {
    Dispatcher.off(ActionTypes.FILTER_LINKS, this.setFilterMode);
    Dispatcher.off(ActionTypes.PASS_ON_KEYSTROKES, this.handleMyKeys);
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
    let toTableId = this.props.cell.column.toTable;
    let toTable = this.props.cell.tables.get(toTableId);

    // Data already fetched, show it instantly and update it in the background
    if (toTable.rows.length > 0) {
      this.setRowResult(toTable.rows);
    }

    const fetchColumns = new Promise(
      (resolve, reject) => {
        const colXhr = toTable.columns.fetch({
          success: resolve,
          error: reject
        });
        this.props.addAbortableXhrRequest(colXhr);
      }
    );

    const fetchRows = new Promise(
      (resolve, reject) => {
        const rowXhr = toTable.rows.fetch({
          url: apiUrl("/tables/" + toTableId + "/columns/first/rows"),
          success: () => {
            this.setRowResult(toTable.rows, true);
            resolve(toTable);
          },
          error: reject
        });
        this.props.addAbortableXhrRequest(rowXhr);
      }
    );

    fetchColumns.then(fetchRows);
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
    this.allRowResults = rowResult.models || rowResult;
    // we always rebuild the row names, also to prevent wrong display names when switching languages
    this.setState({
      // we show all the rows
      rowResults: this.filterRowsBySearch(this.getCurrentSearchValue()),
      loading: false
    });
  };

  getRowValues = (row) => {
    const {toColumn, toTable} = this.props.cell.column;
    const toTableObj = this.props.cell.tables.get(toTable);
    const toTableColumns = toTableObj.columns;
    const toIdColumnIndex = toTableColumns.indexOf(toTableColumns.get(toColumn.id));
    return row.values[toIdColumnIndex];
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
      f.join(" "),
      f.map(f.get(["displayValue", langtag])),
      f.get(["cells", "models"]),
    );
    return {
      linked: linkedRows,
      unlinked: (filterValue !== "") ? unlinkedRows.filter(byDisplayValues) : unlinkedRows
    };
  };

  addLinkValue = (isLinked, row, event) => {
    maybe(event).method("preventDefault");
    const cell = this.props.cell;
    const rowCellIdValue = this.getRowValues(row);
    const link = {
      id: row.id,
      value: rowCellIdValue
    };
    let links = _.clone(cell.value);

    if (isLinked) {
      _.remove(links, function (linked) {
        return row.id === linked.id;
      });
    } else {
      links.push(link);
    }
    ActionCreator.changeCell(cell, links);
    this.setState({rowResults: this.filterRowsBySearch(this.getCurrentSearchValue())});
  };

  isRowLinked = (row) => {
    const currentCellValue = either(this.props.cell)
      .map(f.prop(["value"]))
      .getOrElse(null);
    return !!_.find(currentCellValue, link => link.id === row.id);
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
      this.setState({selectedMode: val});
      this.background.focus();
      // e.stopPropagation();
    };

    const mouseOverItemHandler = index => e => {
      this.setSelectedId(index);
      this.background.focus();
      // e.stopPropagation();
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
    const {cell: {column: {displayName, toTable}}, langtag} = this.props;
    const addAndLinkRow = () => {
      const isAlreadyLinked = false;
      ActionCreator.addRow(toTable, row => this.addLinkValue(isAlreadyLinked, row));
    };

    const linkTableName = displayName[langtag] || displayName[FallbackLanguage] || "";

    return (
      <div className="row-creator-button" onClick={addAndLinkRow}>
        <SvgIcon icon="plus" containerClasses="color-primary" />
        <span>{i18n.t("table:link-overlay-add-new-row", {tableName: linkTableName})}</span>
      </div>
    );
  };

  render = () => {
    const {rowResults, loading} = this.state;
    const {cell: {column}, cell: {column: {displayName}}, langtag} = this.props;
    const targetTable = {
      tableId: column.toTable,
      langtag
    };

    const unlinkedRows = (loading)
      ? "Loading..."
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
        <div className="linked-items" onMouseEnter={() => {
          this.setState({activeBox: LINKED_ITEMS});
        }}>
          <span className="items-title">
            <span>{i18n.t("table:link-overlay-items-title")}
              <a className="table-link" href="#" onClick={() => openInNewTab(targetTable)}>
                {displayName[this.props.langtag] || displayName}
              </a>
            </span>
          </span>
          {linkedRows}
        </div>
        <div className="unlinked-items" onMouseEnter={() => {
          this.setState({activeBox: UNLINKED_ITEMS});
        }}>
          {unlinkedRows}
        </div>
        {this.renderRowCreator()}
      </div>
    );
  }
}

export const openLinkOverlay = (cell, langtag) => {
  const table = cell.tables.get(cell.tableId);
  const tableName = table.displayName[langtag] || table.displayName[FallbackLanguage];
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
