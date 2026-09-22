import classNames from "classnames";
import f from "lodash/fp";
import PropTypes from "prop-types";
import React from "react";
import { translate } from "react-i18next";
import { FallbackLanguage } from "../../../constants/TableauxConstants";
import { memoizeOne } from "../../../helpers/functools.js";
import { getTableDisplayName } from "../../../helpers/multiLanguage";
import { isTaxonomyTable } from "../../taxonomy/taxonomy";
import TableSwitcherPopup from "./TableSwitcherPopup";

const sortTables = memoizeOne((langtag, tables, getDisplayName) =>
  f.compose(f.sortBy(getDisplayName(langtag)), f.reject("hidden"))(tables)
);

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

  onClickedOutside = () => {
    this.setState({ isOpen: false });
  };

  onClickedGroup = groupId => {
    const newGroupId =
      groupId === this.state.currentGroupId
        ? null // clicked again so toggle off
        : groupId; // set new group

    this.setState({ currentGroupId: newGroupId });
  };

  renderPopup = () => {
    const {
      t,
      langtag,
      tables: allTables,
      currentTable,
      navigate
    } = this.props;
    const tables = f.reject(isTaxonomyTable, allTables);

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
        f.props(["langtags", FallbackLanguage]),
        f.find(f.identity)
      ),
      groups
    );

    const getDisplayName = langtag =>
      f.pipe(table => getTableDisplayName(table, langtag), f.deburr, f.toLower);

    const sortedTables = sortTables(langtag, tables, getDisplayName);

    return (
      <TableSwitcherPopup
        langtag={langtag}
        groups={[noGroup, ...sortedGroups]}
        tables={sortedTables}
        currentTable={currentTable}
        handleClickOutside={this.onClickedOutside}
        onClickedGroup={this.onClickedGroup}
        currentGroupId={this.state.currentGroupId}
        navigate={navigate}
      />
    );
  };

  togglePopup = event => {
    event.preventDefault();
    this.setState({ isOpen: !this.state.isOpen });
  };

  render() {
    const open = this.state.isOpen;
    const buttonClass = `button${open ? " ignore-react-onclickoutside" : ""}`;
    const chevronClass = `table-switcher-icon-chevron fa fa-angle-${
      open ? "up" : "down"
    }`;

    // Show display name with fallback to machine name
    const table = this.props.currentTable;
    const tableDisplayName = getTableDisplayName(table, this.props.langtag);
    const cssClass = classNames("", { active: open });
    return (
      <>
        <div id="tableswitcher-wrapper" className={cssClass}>
          <button className={buttonClass} onClick={this.togglePopup}>
            <i className="fa fa-columns" />
            {tableDisplayName}
          </button>
          <button
            className={buttonClass + " button-chevron"}
            onClick={this.togglePopup}
          >
            {" "}
            <i className={chevronClass} />{" "}
          </button>

          {open ? this.renderPopup() : null}
        </div>
      </>
    );
  }
}

export default translate(["header"])(TableSwitcherButton);
