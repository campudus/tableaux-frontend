import React, {PureComponent} from "react";
import PropTypes from "prop-types";
// import ActionCreator from "../../../actions/ActionCreator";
import "react-virtualized/styles.css";
import {translate} from "react-i18next";
import i18n from "i18next";
import {ActionTypes, DefaultLangtag, Directions, FilterModes} from "../../../constants/TableauxConstants";
import {either, maybe} from "../../../helpers/functools";
import * as f from "lodash/fp";
import SearchFunctions from "../../../helpers/searchFunctions";
import KeyboardShortcutsHelper from "../../../helpers/KeyboardShortcutsHelper";
import apiUrl, {openInNewTab} from "../../../helpers/apiUrl";
import withAbortableXhrRequests from "../../helperComponents/withAbortableXhrRequests";
import OverlayHeadRowIdentificator from "../../overlay/OverlayHeadRowIdentificator";
import Header from "../../overlay/Header";
// import Dispatcher from "../../../dispatcher/Dispatcher";
import {loadAndOpenEntityView} from "../../overlay/EntityViewOverlay";
import SearchBar from "./LinkOverlaySearchBar";
import LinkItem from "./LinkItem";
import Request from "superagent";
// import connectToAmpersand from "../../helperComponents/connectToAmpersand";
import {mkLinkDisplayItem} from "./linkDisplayItemHelper";
import Raven from "raven-js";
import {LinkedRows, LinkStatus, RowCreator, SwitchSortingButton, UnlinkedRows} from "./LinkOverlayFragments";
// import {INITIAL_PAGE_SIZE, MAX_CONCURRENT_PAGES, PAGE_SIZE} from "../../../models/Rows";
import {Promise} from "es6-promise";
import Spinner from "../../header/Spinner";
import Throat from "throat";
// import changeCell from "../../../models/helpers/changeCell";
const throat = Throat(Promise);

const MAIN_BUTTON = 0;
const LINK_BUTTON = 1;
const LINKED_ITEMS = 0;
const UNLINKED_ITEMS = 1;

const sortIcons = [
  "fa fa-sort-numeric-asc",
  "fa fa-sort-alpha-asc"
];

// @translate(["table"])
// @withAbortableXhrRequests
class LinkOverlay extends PureComponent {
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

  sortModes = [
    f.sortBy(f.get("id")),
    f.sortBy(
      f.flow(
        f.get(["displayValue", this.props.langtag]),
        f.toLower
      )
    )
  ];

  componentDidMount = () => {
    // Dispatcher.on(ActionTypes.FILTER_LINKS, this.setFilterMode);
    // Dispatcher.on(ActionTypes.PASS_ON_KEYSTROKES, this.handleMyKeys);
    // Dispatcher.on(ActionTypes.BROADCAST_DATA_CHANGE, this.updateValues);
  };

  componentWillUnmount = () => {
    // Dispatcher.off(ActionTypes.FILTER_LINKS, this.setFilterMode);
    // Dispatcher.off(ActionTypes.PASS_ON_KEYSTROKES, this.handleMyKeys);
    // Dispatcher.off(ActionTypes.BROADCAST_DATA_CHANGE, this.updateValue);
  };

  componentWillReceiveProps(nextProps) {
    const curOrder = f.getOr(0, "unlinkedOrder", this.props.sharedData);
    const nextOrder = nextProps.sharedData.unlinkedOrder;
    if (!f.isNil(nextOrder) && curOrder !== nextOrder) {
      this.setState({
        rowResults: this.filterRowsBySearch(this.getCurrentSearchValue(), nextOrder)
      });
    }
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
      const N = f.size(rows);
      const selectedId = this.getSelectedId();
      const nextIdx = (selectedId + ((dir === Directions.UP) ? -1 : 1) + N) % N;
      this.setSelectedId(nextIdx);
    };
    return {
      enter: event => {
        const {activeBox, rowResults} = this.state;
        const activeBoxIDString = (activeBox === LINKED_ITEMS) ? "linked" : "unlinked";
        const row = f.get([activeBoxIDString, this.getSelectedId()], rowResults);
        if (f.isEmpty(row)) {
          return;
        }
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
        // ActionCreator.closeOverlay();
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
    this.setState({selectedId: f.assoc(activeBox, idToSet, this.state.selectedId)});
  };

  getSelectedId = () => {
    const activeBox = (this.state.activeBox === LINKED_ITEMS) ? "linked" : "unlinked";
    return f.get(activeBox, this.state.selectedId);
  };

  componentWillMount = () => {
    this.setState({loading: true});
    const {cell} = this.props;
    const toTableId = cell.column.toTable;
    const toTable = cell.tables.get(toTableId);

    // Data already fetched, show it instantly and update it in the background
    if (f.size(toTable.rows) > 0) {
      this.setRowResult(toTable.rows);
    }

    // TODO: Page me!

    const fetchColumns = new Promise(
      (resolve, reject) => {
        const colXhr = toTable.columns.fetch({
          success: resolve,
          error: reject,
          reset: false
        });
        this.props.addAbortableXhrRequest(colXhr);
      }
    );

    fetchColumns // columns still needed to create display strings
      .then(this.fetchForeignRowsJson);
  };

  fetchForeignRowsJson = () => {
    this.setState({loading: true});
    const {cell} = this.props;
    const toTableId = cell.column.toTable;
    const toTable = cell.tables.get(toTableId);
    const tableUrl = apiUrl(`/tables/${cell.tableId}/columns/${cell.column.id}/rows/${cell.row.id}/foreignRows`);

    const processHead = (response, err) => new Promise(
      (resolve, reject) => {
        if (err) {
          reject(err);
        } else {
          const obj = JSON.parse(response.text);
          const rows = f.map(mkLinkDisplayItem(toTable), obj.rows);
          this.setRowResult(rows, true);
          const pages = (obj.page.totalSize > INITIAL_PAGE_SIZE)
            ? 1 + Math.ceil((obj.page.totalSize - INITIAL_PAGE_SIZE) / PAGE_SIZE)
            : 1;
          resolve({pages});
        }
      }
    );

    const fetchTail = ({pages}) => {
      if (pages === 1) {
        return;
      }
      this.props.updateSharedData(f.always({loading: true}));
      const processPage = f.flow(
        f.get("text"),
        JSON.parse,
        f.get("rows"),
        f.map(mkLinkDisplayItem(toTable)),
        this.addRowResults
      );

      const fetchPage = throat(
        MAX_CONCURRENT_PAGES,
        (page) => new Promise(
          (resolve, reject) => {
            const xhr = Request
              .get(tableUrl)
              .query({
                offset: INITIAL_PAGE_SIZE + (page - 2) * PAGE_SIZE,
                limit: PAGE_SIZE
              });
            this.props.addAbortableXhrRequest(xhr);
            xhr.then(processPage)
              .then(resolve);
          }
        )
      );

      Promise.all(
        f.range(2, pages + 1).map(fetchPage)
      )
        .then(() => this.props.updateSharedData(f.always({loading: false})))
        .catch(() => this.props.updateSharedData(f.always({loading: false})));
    };

    const rowXhr = Request
      .get(tableUrl)
      .query({
        offset: 0,
        limit: INITIAL_PAGE_SIZE
      })
      .then(processHead)
      .then(fetchTail);
    this.props.addAbortableXhrRequest(rowXhr);
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

  setRowResult = (rowResult) => {
    const {cell} = this.props;
    const linkedRows = f.map(
      ([cellValue, cellDisplayValue]) => ({
        id: cellValue.id,
        value: cellValue.value,
        displayValue: cellDisplayValue
      }),
      f.zip(cell.value, cell.displayValue)
    );
    this.updateRowResults(() => f.uniqBy("id", [...linkedRows, ...rowResult]));
    this.setState({
      rowResults: this.filterRowsBySearch(this.getCurrentSearchValue()),
      loading: false
    });
  };

  addRowResults = (rows) => new Promise(
    (resolve) => {
      this.updateRowResults((knownRows) => f.uniqBy("id", [...knownRows, ...rows]));
      this.setState({
        rowResults: this.filterRowsBySearch(this.getCurrentSearchValue())
      });
      resolve();
    }
  );

  updateValues = (data) => {
    const {cell} = data;
    const thisCell = this.props.cell;

    if (cell === thisCell) {
      this.setState({
        rowResults: this.filterRowsBySearch(this.getCurrentSearchValue())
      });
    } else if (cell.column.id === thisCell.column.toColumn.id && cell.tableId === thisCell.column.toTable) {
      this.updateLinkValues(data);
    }
  };

  updateLinkValues = ({cell, row = {}}) => {
    const oldValueIdx = f.findIndex(f.matchesProperty("id", row.id), this.allRowResults);
    const newLink = f.assoc("id", row.id, f.pick(["value", "displayValue"], cell));
    this.updateRowResults(f.assoc(oldValueIdx, newLink));
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

  filterRowsBySearch = (
    searchParams,
    sortMode = f.getOr(0, "unlinkedOrder", this.props.sharedData)
  ) => {
    const {langtag} = this.props;
    const {filterValue, filterMode} = searchParams;
    const searchFunction = SearchFunctions[filterMode];
    const {allRowResults} = this;
    const linkPosition = f.reduce(
      f.merge, {}, this.props.cell.value.map((row, idx) => ({[f.get("id", row)]: idx}))
    );
    const linkedRows = f.flow(
      f.filter(this.isRowLinked),
      f.sortBy(link => f.get(link.id, linkPosition))
    )(allRowResults);
    const unlinkedRows = f.reject(this.isRowLinked, allRowResults);
    const byDisplayValues = f.flow(
      f.get(["displayValue", langtag]),
      searchFunction(filterValue)
    );
    const unlinked = (filterValue !== "") ? f.filter(byDisplayValues, unlinkedRows) : unlinkedRows;
    const sortUnlinked = this.sortModes[sortMode];
    return {
      linked: linkedRows,
      unlinked: sortUnlinked(unlinked)
    };
  };

  getToCardinality = () => {
    const {cell: {column: {constraint}}} = this.props;
    const cardinalityTo = f.get(["cardinality", "to"], constraint);
    return (cardinalityTo > 0) ? cardinalityTo : Number.POSITIVE_INFINITY;
  };

  canAddLink = () => {
    return f.size(this.state.rowResults.linked) < this.getToCardinality();
  };

  addLinkValue = (isAlreadyLinked, link, event) => {
    maybe(event).method("preventDefault");
    const shouldLink = !isAlreadyLinked;
    const maxLinks = this.getToCardinality();

    if (shouldLink && !this.canAddLink()) {
      // ActionCreator.showToast(
      //   <div id="cell-jump-toast">
      //     {i18n.t("table:cardinality-reached", {maxLinks})}
      //   </div>
      // );
      Raven.captureMessage("Tried to add link with wrong cardinality", {level: "warning"});
      return;
    }

    const cell = this.props.cell;

    const withoutLink = f.remove(f.matchesProperty("id", f.get("id", link)));
    const links = (!shouldLink)
      ? withoutLink(cell.value)
      : [...cell.value, link];

    if (!shouldLink && f.get(["constraint", "deleteCascade"], cell.column)) {
      this.updateRowResults(withoutLink);
    }

    // ActionCreator.changeCell(cell, links,
    //   () => {
    //     if (f.isFinite(maxLinks)) {
    //       this.fetchForeignRowsJson();
    //     }
    //   }
    // );
    this.setState({rowResults: this.filterRowsBySearch(this.getCurrentSearchValue())});
  };

  isRowLinked = (row) => {
    const currentCellValue = either(this.props.cell)
      .map(f.get(["value"]))
      .getOrElse(null);
    const rowId = f.get("id", row);
    return !!f.find(f.matchesProperty("id", rowId), currentCellValue);
  };

  setActiveBox = (val) => (e) => {
    this.setState({activeBox: val});
    e.stopPropagation();
  };

  renderListItem = ({isLinked}) => ({key, index, style = {}}) => {
    const {selectedMode, activeBox} = this.state;
    const rowResults = f.get((isLinked) ? "linked" : "unlinked", this.state.rowResults);
    const row = rowResults[index];

    if (f.isEmpty(rowResults) || f.isEmpty(row)) {
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
    };

    const mouseOverItemHandler = index => e => {
      this.setSelectedId(index);
      this.setState({activeBox: (isLinked) ? LINKED_ITEMS : UNLINKED_ITEMS});
      e.stopPropagation();
    };

    return (
      <LinkItem
        key={`${key}-${row.id}`}
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

  swapLinkedItems = (a, b) => {
    const linkedItems = f.get(["rowResults", "linked"], this.state) || [];
    const {cell} = this.props;
    const rearranged = f.flow(
      f.assoc(b, f.get(a, linkedItems)),
      f.assoc(a, f.get(b, linkedItems))
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

  updateRowResults = (fn) => {
    this.allRowResults = fn(this.allRowResults);
  };

  render = () => {
    const {rowResults, loading} = this.state;
    const {
      cell,
      cell: {column},
      cell: {column: {displayName}},
      langtag,
      sharedData: {unlinkedOrder}
    } = this.props;
    const targetTable = {
      tableId: column.toTable,
      langtag
    };

    const noForeignRows = f.isEmpty(rowResults.unlinked) // there are no unlinked rows
      || !this.canAddLink(); // or link cardinality reached

    // because keeping track of multiple partial localisation strings gets more tiresome...
    const linkEmptyLines = i18n.t("table:link-overlay-empty").split(".");

    return (
      <div onKeyDown={KeyboardShortcutsHelper.onKeyboardShortcut(this.getKeyboardShortcuts)}
        className="link-overlay"
        tabIndex={1}
        ref={el => {
          this.background = el;
        }}
      >
        <div className={`linked-items${(!loading && noForeignRows) ? " no-unlinked" : ""}`}
          onMouseEnter={this.setActiveBox(LINKED_ITEMS)}
        >
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
            <LinkStatus rowResults={rowResults}
              maxLinks={this.getToCardinality()}
            />
          </span>
          <LinkedRows loading={loading}
                      linkEmptyLines={linkEmptyLines}
                      listItemRenderer={this.renderListItem}
                      swapItems={this.swapLinkedItems}
                      rowResults={rowResults}
          />
        </div>
        <UnlinkedRows loading={loading}
                      order={unlinkedOrder}
                      noForeignRows={noForeignRows}
                      rowCount={f.size(rowResults.unlinked) + 1}
                      renderRows={this.renderListItem}
                      scrollToIndex={this.state.selectedId.unlinked}
                      setActiveBox={this.setActiveBox}
                      activeBox={UNLINKED_ITEMS}
                      selectedBox={this.state.activeBox}
                      selectedMode={this.state.selectedMode}
        />
        <RowCreator langtag={langtag}
                    canAddLinks={this.canAddLink()}
                    cell={cell}
                    shiftUp={noForeignRows && !loading}
                    updateRowResults={this.updateRowResults}
                    addLink={this.addLinkValue}
        />
      </div>
    );
  }
}

export const openLinkOverlay = (cell, langtag) => {
  const table = cell.tables.get(cell.tableId);
  const tableName = table.displayName[langtag] || table.displayName[DefaultLangtag];
  const overlayContent = <LinkOverlay cell={cell} langtag={langtag} />;

  const LinkOverlayHeader = connectToAmpersand(
    (props) => {
      const {langtag, cell, sharedData: {loading, unlinkedOrder = 0}, updateSharedData, id} = props;
      return (
        <Header context={tableName} id={props.id}
          title={<OverlayHeadRowIdentificator cell={cell} langtag={langtag} />}
        >
          <SearchBar langtag={langtag} id={id} />,
          <SwitchSortingButton unlinkedOrder={unlinkedOrder}
                               updateSharedData={updateSharedData}
                               sortIcons={sortIcons}
          />
          <Spinner isLoading={loading} customOptions={{color: "#eee"}} />
        </Header>
      );
    }
  );

  // ActionCreator.openOverlay({
  //   head: <LinkOverlayHeader langtag={langtag} cell={cell} />,
  //   body: overlayContent,
  //   type: "full-height",
  //   classes: "link-overlay"
  // });
};

export default LinkOverlay;
