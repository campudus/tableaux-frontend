import f from "lodash/fp";
import PropTypes from "prop-types";
import React from "react";
import { translate } from "react-i18next";
import listensToClickOutside from "react-onclickoutside";
import { withRouter } from "react-router-dom";
import { ShowArchived } from "../../../archivedRows/helpers";
import { FilterModes } from "../../../constants/TableauxConstants";
import { forkJoin, maybe } from "../../../helpers/functools";
import KeyboardShortcutsHelper from "../../../helpers/KeyboardShortcutsHelper";
import {
  getTableDisplayName,
  retrieveTranslation
} from "../../../helpers/multiLanguage";
import SearchFunctions from "../../../helpers/searchFunctions";
import Action from "../../../redux/actionCreators";
import store from "../../../redux/store";

class SwitcherPopup extends React.PureComponent {
  constructor(props) {
    super(props);
    const focusTableId = props.currentTable ? props.currentTable.id : null;

    this.state = {
      filterGroupId:
        props.currentGroupId !== null && f.isFinite(props.currentGroupId)
          ? props.currentGroupId
          : null,
      filterTableName: "",
      focusTableId,
      filteredTables: this.getFilteredTables(props.currentGroupId, "")
    };
  }

  componentDidMount = () => {
    // scroll to current focus table (initially its the current table)
    // by setting temporary focus
    maybe(this.state.focusTableId)
      .map(id => this.tableRefs[id])
      .method("focus");

    // reset focus to filter input
    this.focusFilterInput();
  };

  focusFilterInput = () => {
    maybe(this.filterInput).method("focus");
  };

  componentDidUpdate = () => {
    this.componentDidMount();
  };

  handleClickOutside = event => {
    this.props.handleClickOutside(event);
  };

  onClickGroup = group => () => {
    const clickGroupHandler = this.props.onClickedGroup;
    const groupId = f.get("id", group);
    const isDeselection =
      groupId === 0 ||
      (f.isInteger(groupId) && groupId === this.state.filterGroupId);
    const newGroupId = isDeselection ? null : groupId;
    clickGroupHandler(newGroupId);

    this.setState({
      filterGroupId: newGroupId,
      filterTableName: ""
    });

    this.focusFilterInput();

    const tableResults = this.getFilteredTables(group.id, "");
    // on click search gets cleared, so only matching tables are visible
    const tableIds = f.map("id", tableResults.inGroup);
    const { currentTable } = this.props;
    const { focusTableId } = this.state;
    const currentTableId = f.get("id", currentTable);
    if (isDeselection && currentTable) {
      this.setState({
        focusTableId: currentTableId,
        filteredTables: tableResults
      });
    } else {
      this.setState({
        focusTableId: f.contains(currentTableId, tableIds)
          ? currentTableId
          : f.contains(focusTableId, tableIds)
          ? focusTableId
          : f.first(tableIds),
        filteredTables: tableResults
      });
    }
  };

  onClickTable = table => () => {
    const { history } = this.props;
    this.setState({
      focusTableId: table.id
    });
    store.dispatch(Action.setShowArchivedRows(table, ShowArchived.hide));
    this.handleClickOutside(null);
    history.push(
      history.location.pathname.replace(/tables.*/, `tables/${table.id}`)
    );
  };

  filterInputChange = event => {
    const filteredTables = this.getFilteredTables(
      this.state.filterGroupId,
      event.target.value
    );
    const allResults = [
      ...filteredTables.inGroup,
      ...filteredTables.notInGroup
    ];
    const focusTableId =
      allResults.length > 0
        ? f.first(allResults).id
        : this.props.currentTable.id;

    this.setState({
      focusTableId: focusTableId,
      filterTableName: event.target.value,
      filteredTables
    });
  };

  onUpDownNavigation = nextFocusTableIndexFn => {
    const { filteredTables } = this.state;
    const allResults = [
      ...(filteredTables.inGroup || []),
      ...(filteredTables.notInGroup || [])
    ];
    if (f.isEmpty(allResults)) {
      return;
    }

    // If no search happened and a group is selected, only .inGroup tables are displayed
    const N =
      f.isEmpty(this.state.filterTableName) &&
      f.isInteger(this.state.filterGroupId)
        ? f.size(filteredTables.inGroup)
        : f.size(allResults);

    const focusTableIndex = f.flow(
      f.findIndex(f.matchesProperty("id", this.state.focusTableId)),
      f.defaultTo(0),
      idx => Math.max(idx, 0)
    )(allResults);
    const nextFocusTableIndex =
      (nextFocusTableIndexFn(focusTableIndex) + N) % N;
    this.setState({
      focusTableId: f.get([nextFocusTableIndex, "id"], allResults)
    });
  };

  getKeyboardShortcutsFilterTable = () => {
    return {
      // enter on input
      enter: () => {
        const filteredTables = this.getFilteredTables(
          this.state.filterGroupId,
          this.state.filterTableName
        );
        if (
          f.size(filteredTables.inGroup) + f.size(filteredTables.notInGroup) >
          0
        ) {
          this.onClickTable({ id: this.state.focusTableId })();
        }
      },
      // clear input
      escape: () => {
        this.setState({
          filterTableName: "",
          focusTableId: this.props.currentTable.id
        });
      },
      up: event => {
        // Cursor jumps around. Silly cursor stop doing that!
        event.preventDefault();
        this.onUpDownNavigation(f.add(-1));
      },
      down: event => {
        // Cursor jumps around. Silly cursor stop doing that!
        event.preventDefault();
        this.onUpDownNavigation(f.add(1));
      }
    };
  };

  getFilteredTables = (filterGroupId, filterTableName) => {
    const { langtag, tables } = this.props;
    const getDisplayNameOrFallback = table =>
      getTableDisplayName(table, langtag);
    const matchesQuery = query =>
      f.flow(
        forkJoin(
          (a, b) => a + " " + b,
          getDisplayNameOrFallback,
          f.get("name")
        ),
        SearchFunctions[FilterModes.CONTAINS](query)
      );

    const isInGroup = f.matchesProperty(["group", "id"], filterGroupId);

    const tableResults = f.filter(matchesQuery(filterTableName), tables);

    return {
      inGroup: filterGroupId ? f.filter(isInGroup, tableResults) : [],
      notInGroup: filterGroupId
        ? f.reject(isInGroup, tableResults)
        : tableResults
    };
  };

  renderGroups = groups => {
    const { t, langtag } = this.props;

    const renderGroup = group => {
      const groupDisplayName = retrieveTranslation(
        langtag,
        f.get("displayName", group)
      );

      const isNoGroupGroup = group.id === 0;
      const isActive = this.state.filterGroupId === group.id;

      let className = "";
      className += isNoGroupGroup ? " nogroup" : "";
      className += isActive ? " active" : "";

      return (
        <li
          key={"group" + group.id}
          onClick={this.onClickGroup(group)}
          className={className}
        >
          {groupDisplayName}
          {isActive ? <i className="fa fa-times-circle" /> : ""}
        </li>
      );
    };

    const renderedGroups = f.flow(
      f.drop(1), // remove "show all tables" entry
      f.sortBy(f.get(["displayName", langtag])), // sort groups
      sortedGroups => [f.first(groups), ...sortedGroups], // recombine with "show all" entry
      f.map(renderGroup)
    )(groups);

    if (groups.length <= 1) {
      return "";
    } else {
      return (
        <div className="tableswitcher-groups">
          <div className="tableswitcher-label">
            <i className="fa fa-filter" /> {t("tableSwitcher.groups")}
          </div>

          <div className="tableswitcher-groups-list">
            <ul>{renderedGroups}</ul>
          </div>
        </div>
      );
    }
  };

  storeTableRef = id => element => {
    !this.tableRefs && (this.tableRefs = {});
    this.tableRefs[id] = element;
  };

  renderTables = (groups, tables) => {
    const { t, langtag, currentTable } = this.props;
    const groupId = this.state.filterGroupId;
    const { focusTableId } = this.state;
    const currentTableId = f.get("id", currentTable);
    const queryStr = this.state.filterTableName;
    const isGroupSelected = f.isNumber(groupId);
    const isSearchEntered = !f.isEmpty(queryStr);
    const hasGroupResults = !f.isEmpty(tables.inGroup);
    const hasOtherResults = !f.isEmpty(tables.notInGroup);
    const hasResults = hasGroupResults || hasOtherResults;

    const renderTable = (table, index) => {
      const displayName = getTableDisplayName(table, langtag);
      const tableId = table.id;
      const isActive = f.every(f.identity, [
        f.matchesProperty("id", focusTableId)(table),
        f.isInteger(focusTableId)
      ]);
      const isCurrentTable = f.every(f.identity, [
        f.matchesProperty("id", currentTableId)(table),
        f.isInteger(currentTableId)
      ]);
      const onKeyDownFn = f.always({ enter: this.onClickTable(table) });
      const newUrl = `/${this.props.langtag}/tables/${table.id}`;
      const onClickFn = isCurrentTable
        ? this.handleClickOutside
        : this.onClickTable(table);

      return (
        <li
          key={`table${index}`}
          className={isActive ? "active" : ""}
          onKeyDown={KeyboardShortcutsHelper.onKeyboardShortcut(onKeyDownFn)}
          tabIndex={0}
          ref={this.storeTableRef(tableId)}
        >
          <div onClick={onClickFn}>{displayName}</div>
          <a target="_blank" rel="noopener noreferrer" href={newUrl}>
            <i className="fa fa-external-link" />
          </a>
        </li>
      );
    };

    const style = groups.length <= 1 ? { width: "100%" } : {};

    const separator = !hasResults ? (
      <div className="separator">
        <div className="no-results">
          {t("tableSwitcher.no-results", { query: queryStr })}
        </div>
      </div>
    ) : (
      <div className="separator">
        {!hasGroupResults && (isSearchEntered && groupId > 0) ? (
          <div className="no-results">
            {t("tableSwitcher.no-group-results", {
              query: this.state.filterTableName,
              group: f.flow(
                f.find(f.matchesProperty("id", groupId)),
                retrieveTranslation(langtag)
              )(groups)
            })}
          </div>
        ) : null}
        {hasOtherResults && isGroupSelected && isSearchEntered ? (
          <div className="in-all-tables">
            {t("tableSwitcher.in-all-tables")}
          </div>
        ) : null}
      </div>
    );

    return (
      <div className="tableswitcher-tables" style={style}>
        <div className="tableswitcher-tables-search">
          <div className="tableswitcher-label">
            <i className="fa fa-columns" /> {t("tableSwitcher.tables")}
          </div>

          <div className="tableswitcher-input-wrapper2">
            <div className="tableswitcher-input-wrapper">
              <input
                value={queryStr}
                placeholder={t("tableSwitcher.search")}
                type="text"
                className="tableswitcher-input"
                ref={this.storeInputRef}
                onChange={this.filterInputChange}
                onKeyDown={KeyboardShortcutsHelper.onKeyboardShortcut(
                  this.getKeyboardShortcutsFilterTable
                )}
                autoFocus={true}
              />
              <i className="fa fa-search" />
            </div>
          </div>
        </div>

        <div className="tableswitcher-tables-list">
          <ul>{tables.inGroup.map(renderTable)}</ul>
          {f.every(f.isNil, separator.props.children) // Only render messages when there are any
            ? null
            : separator}
          {isSearchEntered || !isGroupSelected ? (
            <ul>{tables.notInGroup.map(renderTable)}</ul>
          ) : null}
        </div>
      </div>
    );
  };

  storeInputRef = element => {
    this.filterInput = element;
  };

  render() {
    const groups = this.props.groups;
    const { filteredTables } = this.state;

    return (
      <div id="tableswitcher-popup">
        <div id="tableswitcher-popup-internal-wrapper">
          {this.renderGroups(groups)}
          {this.renderTables(groups, filteredTables)}
        </div>
      </div>
    );
  }
}

SwitcherPopup.propTypes = {
  handleClickOutside: PropTypes.func.isRequired,
  langtag: PropTypes.string.isRequired,
  tables: PropTypes.array.isRequired,
  groups: PropTypes.array.isRequired,
  currentTable: PropTypes.object.isRequired,
  currentGroupId: PropTypes.number
};

export default f.flow(
  translate(["header"]),
  listensToClickOutside,
  withRouter
)(SwitcherPopup);
