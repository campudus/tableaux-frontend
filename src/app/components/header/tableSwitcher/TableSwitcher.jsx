import React from "react";
import f from "lodash/fp";
import TableauxConstants from "../../../constants/TableauxConstants";
import TableSwitcherPopup from "./TableSwitcherPopup";
import {translate} from "react-i18next";
import * as AccessControl from "../../../helpers/accessManagementHelper";
import classNames from "classnames";
import PropTypes from "prop-types";

@translate(["header"])
class TableSwitcherButton extends React.PureComponent {
  static propTypes = {
    langtag: PropTypes.string.isRequired,
    tables: PropTypes.object.isRequired,
    currentTable: PropTypes.object.isRequired
  };

  state = {
    isOpen: false,
    currentGroupId: null
  };

  refresh = () => {
    this.forceUpdate();
  };

  onClickedOutside = event => {
    this.setState({isOpen: false});
  };

  onClickedGroup = groupId => {
    const newGroupId =
      groupId === this.state.currentGroupId
        ? null // clicked again so toggle off
        : groupId; // set new group

    this.setState({currentGroupId: newGroupId});
  };

  renderPopup = () => {
    const {t, langtag, tables, currentTable,navigate} = this.props;

    const groups = f.flow(
      f.reject("hidden"), //   ...of visible tables
      f.map("group"), //   ...from group data
      f.compact, //   ...of non-null groups
      f.reject(f.matchesProperty("id", 0)), //   ...with valid ids
      f.uniqBy("id") // unique set of groups
    )(tables);

    const noGroupDisplayName = {};
    noGroupDisplayName[langtag] = t("tableSwitcher.nogroup");
    const noGroup = {
      id: 0,
      displayName: noGroupDisplayName
    };

    const sortedGroups = f.sortBy(
      f.flow(
        f.get("displayName"),
        f.props(["langtags", TableauxConstants.FallbackLanguage]),
        f.find(f.identity)
      ),
      groups
    );

    const getDisplayName = f.pipe(
      f.props([
        ["displayName", langtag],
        ["displayName", TableauxConstants.FallbackLanguage],
        ["name"]
      ]),
      f.find(f.identity), // first non-nil
      f.deburr,
      f.toLower
    );

    const sortedTables = f.sortBy(getDisplayName, tables);

    return (
      <TableSwitcherPopup
        langtag={langtag}
        groups={[noGroup, ...sortedGroups]}
        tables={sortedTables}
        currentTable={currentTable}
        onClickedOutside={this.onClickedOutside}
        onClickedGroup={this.onClickedGroup}
        currentGroupId={this.state.currentGroupId}
        navigate={navigate}
      />
    );
  };

  togglePopup = event => {
    event.preventDefault();
    this.setState({isOpen: !this.state.isOpen});
  };

  render() {
    let buttonClass = "button";

    if (this.state.isOpen) {
      buttonClass += " ignore-react-onclickoutside";
    }

    // Show display name with fallback to machine name
    const table = this.props.currentTable;
    const tableDisplayName =
      table.displayName[this.props.langtag] ||
      (table.displayName[TableauxConstants.FallbackLanguage] || table.name);
    const cssClass = classNames("", {
      active: this.state.isOpen,
      "admin-mode": AccessControl.isUserAdmin()
    });
    return (
      <div id="tableswitcher-wrapper" className={cssClass}>
        <a href="#" className={buttonClass} onClick={this.togglePopup}>
          <i className="fa fa-columns" />
          {tableDisplayName}
        </a>
        {this.state.isOpen ? this.renderPopup() : null}
      </div>
    );
  }
}

module.exports = TableSwitcherButton;
