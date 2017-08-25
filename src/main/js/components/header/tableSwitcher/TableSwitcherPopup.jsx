import React from "react";
import listensToClickOutside from "react-onclickoutside";
import {FallbackLanguage, FilterModes} from "../../../constants/TableauxConstants";
import * as _ from "lodash";
import KeyboardShortcutsHelper from "../../../helpers/KeyboardShortcutsHelper";
import ReactDOM from "react-dom";
import {translate} from "react-i18next";
import * as f from "lodash/fp";
import SearchFunctions from "../../../helpers/searchFunctions";
import {forkJoin} from "../../../helpers/functools";

@translate(["header"])
@listensToClickOutside
class SwitcherPopup extends React.PureComponent {

  static propTypes = {
    onClickedOutside: React.PropTypes.func.isRequired,
    onClickedTable: React.PropTypes.func.isRequired,
    onClickedGroup: React.PropTypes.func.isRequired,
    langtag: React.PropTypes.string.isRequired,
    tables: React.PropTypes.object.isRequired,
    groups: React.PropTypes.array.isRequired,
    currentTable: React.PropTypes.object.isRequired,
    currentGroupId: React.PropTypes.number
  };

  constructor(props) {
    super(props);

    this.state = {
      filterGroupId: props.currentGroupId !== null && _.isFinite(props.currentGroupId) ? props.currentGroupId : null,
      filterTableName: "",
      focusTableId: props.currentTable ? props.currentTable.id : null
    };
  }

  componentDidMount = () => {
    // scroll to current focus table (initially its the current table)
    if (this.state.focusTableId !== null && this.refs["table" + this.state.focusTableId]) {
      ReactDOM.findDOMNode(this.refs["table" + this.state.focusTableId]).focus();
    }

    // focus on filter input
    const filterInput = ReactDOM.findDOMNode(this.refs.filterInput);
    filterInput.focus();
  };

  componentDidUpdate = (prevProps, prevState) => {
    this.componentDidMount();
  };

  handleClickOutside = (event) => {
    this.props.onClickedOutside(event);
  };

  onClickGroup = (group) => () => {
    const clickGroupHandler = this.props.onClickedGroup;
    const groupId = f.get("id", group);
    const isDeselection = groupId === 0
      || (f.isInteger(groupId) && groupId === this.state.filterGroupId);
    const newGroupId = (isDeselection) ? null : groupId;
    clickGroupHandler(newGroupId);

    this.setState({
      filterGroupId: newGroupId,
      filterTableName: ""
    });

    // focus on filter input
    const filterInput = ReactDOM.findDOMNode(this.refs.filterInput);
    filterInput.focus();

    const tableResults = this.getFilteredTables(group.id, "");
    // on click search gets cleared, so only matching tables are visible
    const tableIds = f.map(f.get("id"), tableResults.inGroup);
    const {currentTable} = this.props;
    const {focusTableId} = this.state;
    const currentTableId = f.get("id", currentTable);
    if (isDeselection && currentTable) {
      this.setState({focusTableId: currentTableId});
    } else {
      this.setState({
        focusTableId: (f.contains(currentTableId, tableIds))
          ? currentTableId
          : (f.contains(focusTableId, tableIds)) ? focusTableId : f.first(tableIds)
      });
    }
  };

  onClickTable = (table) => () => {
    this.props.onClickedTable(table);
    this.setState({
      focusTableId: table.id
    });
  };

  filterInputChange = (event) => {
    const filteredTables = this.getFilteredTables(this.state.filterGroupId, event.target.value);
    const allResults = [...filteredTables.inGroup, ...filteredTables.notInGroup];
    const focusTableId = (allResults.length > 0) ? f.first(allResults).id : this.props.currentTable.id;

    this.setState({
      focusTableId: focusTableId,
      filterTableName: event.target.value
    });
  };

  onUpDownNavigation = (nextFocusTableIndexFn) => {
    const filteredTables = this.getFilteredTables(this.state.filterGroupId, this.state.filterTableName);
    const allResults = [...(filteredTables.inGroup || []), ...(filteredTables.notInGroup || [])];
    if (f.isEmpty(allResults)) {
      return;
    }

    // If no search happened and a group is selected, only .inGroup tables are displayed
    const N = (f.isEmpty(this.state.filterTableName) && f.isInteger(this.state.filterGroupId))
      ? f.size(filteredTables.inGroup)
      : f.size(allResults);

    const focusTableIndex = f.compose(
      idx => Math.max(idx, 0),
      f.defaultTo(0),
      f.findIndex(f.matchesProperty("id", this.state.focusTableId))
    )(allResults);
    const nextFocusTableIndex = (nextFocusTableIndexFn(focusTableIndex) + N) % N;
    this.setState({focusTableId: f.get([nextFocusTableIndex, "id"], allResults)});
  };

  getKeyboardShortcutsFilterTable = (event) => {
    return {
      // enter on input
      enter: (event) => {
        const filteredTables = this.getFilteredTables(this.state.filterGroupId, this.state.filterTableName);
        if (f.size(filteredTables.inGroup) + f.size(filteredTables.notInGroup) > 0) {
          this.onClickTable({id: this.state.focusTableId})();
        }
      },
      // clear input
      escape: (event) => {
        this.setState({
          filterTableName: "",
          focusTableId: this.props.currentTable.id
        });
      },
      up: (event) => {
        // Cursor jumps around. Silly cursor stop doing that!
        event.preventDefault();
        this.onUpDownNavigation(f.add(-1));
      },
      down: (event) => {
        // Cursor jumps around. Silly cursor stop doing that!
        event.preventDefault();
        this.onUpDownNavigation(f.add(1));
      }
    };
  };

  getFilteredTables = (filterGroupId, filterTableName) => {
    const {langtag, tables} = this.props;
    const matchesQuery = (query) => f.compose(
      SearchFunctions[FilterModes.CONTAINS](query),
      forkJoin(
        (a, b) => a + " " + b,
        f.compose(f.find(f.identity), f.props([["displayName", langtag], ["displayName", FallbackLanguage], " "])),
        f.get("name")
      ),
    );

    const isInGroup = f.matchesProperty(["group", "id"], filterGroupId);

    const tableResults = f.compose(
      f.filter(matchesQuery(filterTableName)),
      f.reject(f.get("hidden")),
    )(tables.models);

    return {
      inGroup: f.filter(isInGroup, tableResults),
      notInGroup: f.reject(isInGroup, tableResults)
    };
  };

  renderGroups = (groups) => {
    const {t, langtag} = this.props;

    const renderedGroups = _.map(groups, (group, index) => {
      const groupDisplayName = group.displayName[langtag] || group.displayName[FallbackLanguage];

      const isNoGroupGroup = group.id === 0;
      const isActive = this.state.filterGroupId === group.id;

      let className = "";
      className += isNoGroupGroup ? " nogroup" : "";
      className += isActive ? " active" : "";

      return (
        <li key={"group" + index} onClick={this.onClickGroup(group)} className={className}>
          {groupDisplayName}
          {isActive ? <i className="fa fa-times-circle"></i> : ""}
        </li>
      );
    });

    if (groups.length <= 1) {
      return "";
    } else {
      return (
        <div className="tableswitcher-groups">
          <div className="tableswitcher-label"><i className="fa fa-filter"></i> {t("tableSwitcher.groups")}</div>

          <div className="tableswitcher-groups-list">
            <ul>
              {renderedGroups}
            </ul>
          </div>
        </div>
      );
    }
  };

  renderTables = (groups, tables) => {
    const {t, langtag} = this.props;
    const groupId = this.state.filterGroupId;
    const {focusTableId} = this.state;
    const queryStr = this.state.filterTableName;
    const isGroupSelected = f.isNumber(groupId);
    const isSearchEntered = !f.isEmpty(queryStr);
    const hasGroupResults = !f.isEmpty(tables.inGroup);
    const hasOtherResults = !f.isEmpty(tables.notInGroup);
    const hasResults = hasGroupResults || hasOtherResults;

    const renderTable = (table, index) => {
      const displayName = table.displayName[langtag] || table.displayName[FallbackLanguage] || table.name;
      const isActive = f.every(f.identity, [
        f.matchesProperty("id", focusTableId)(table),
        f.isInteger(focusTableId)
      ]);
      const onKeyDownFn = f.always({enter: this.onClickTable(table)});
      return (
        <li key={`table${index}`} className={(isActive) ? "active" : ""}
            onKeyDown={KeyboardShortcutsHelper.onKeyboardShortcut(onKeyDownFn)}
            tabIndex={0}
            ref={`table${table.id}`}
        >
          <div onClick={this.onClickTable(table)}>
            {displayName}
          </div>
          <a target="_blank"
             rel="noopener"
             href={`/${langtag}/tables/${table.id}`}><i className="fa fa-external-link" /></a>
        </li>
      );
    };

    const style = groups.length <= 1 ? {width: "100%"} : {};

    const separator = (!hasResults)
      ? (
        <div className="separator">
          <div className="no-results">
            {t("tableSwitcher.no-results", {query: queryStr})}
          </div>
        </div>
      )
      : (
        <div className="separator">
          {(!hasGroupResults && (isSearchEntered && groupId > 0))
            ? (
              <div className="no-results">
                {t("tableSwitcher.no-group-results", {
                  query: this.state.filterTableName,
                  group: f.compose(
                    f.find(f.identity),
                    f.props([["displayName", langtag], ["displayName", FallbackLanguage]]),
                    f.find(f.matchesProperty("id", groupId))
                  )(groups)
                })}
              </div>
            )
            : null
          }
          {(hasOtherResults && isGroupSelected && isSearchEntered)
            ? (
              <div className="in-all-tables">
                {t("tableSwitcher.in-all-tables")}
              </div>
            )
            : null
          }
        </div>
      );

    return (
      <div className="tableswitcher-tables" style={style}>
        <div className="tableswitcher-tables-search">
          <div className="tableswitcher-label"><i className="fa fa-columns"></i> {t("tableSwitcher.tables")}</div>

          <div className="tableswitcher-input-wrapper2">
            <div className="tableswitcher-input-wrapper">
              <input value={queryStr} placeholder={t("tableSwitcher.search")} type="text"
                     className="tableswitcher-input"
                     ref="filterInput" onChange={this.filterInputChange}
                     onKeyDown={KeyboardShortcutsHelper.onKeyboardShortcut(this.getKeyboardShortcutsFilterTable)}
                     autoFocus="true" />
              <i className="fa fa-search"></i>
            </div>
          </div>
        </div>

        <div className="tableswitcher-tables-list">
          <ul>
            {tables.inGroup.map(renderTable)}
          </ul>
          {(f.every(f.isNil, separator.props.children)) // Only render messages when there are any
            ? null
            : separator
          }
          {(isSearchEntered || !isGroupSelected)
            ? <ul>{tables.notInGroup.map(renderTable)}</ul>
            : null
          }
        </div>
      </div>
    );
  };

  render() {
    const groups = this.props.groups;
    const tables = this.getFilteredTables(this.state.filterGroupId, this.state.filterTableName);

    return (
      <div id="tableswitcher-popup">
        <div id="tableswitcher-popup-internal-wrapper">
          {this.renderGroups(groups)}
          {this.renderTables(groups, tables)}
        </div>
      </div>
    );
  }
}

export default SwitcherPopup;
