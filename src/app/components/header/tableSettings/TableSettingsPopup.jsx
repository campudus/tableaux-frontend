/*
 * Content for the TableSettings menu. Entries are individual React items with specific functions.
 */

import React, { PureComponent } from "react";
import i18n from "i18next";
import listensToClickOutside from "react-onclickoutside";

import PropTypes from "prop-types";
import classNames from "classnames";

import { isUserAdmin } from "../../../helpers/accessManagementHelper";
import NameEditor from "./NameEditor";

@listensToClickOutside
class TableSettingsPopup extends PureComponent {
  constructor(props) {
    super(props);
    this.state = { selected: null };
  }

  handleClickOutside = evt => {
    this.props.outsideClickHandler(evt);
  };

  menuItemContents = () => {
    const {
      table,
      langtag,
      actions: { setAllRowsFinal, changeTableName }
    } = this.props;
    return [
      <a key="i-need-no-key" href="#" onClick={() => setAllRowsFinal(table)}>
        {i18n.t("table:final.set_all_rows_final")}
      </a>,
      isUserAdmin() ? <NameEditor table={table} langtag={langtag} changeTableName={changeTableName}/> : null
    ];
  };

  render() {
    return (
      <div id="table-settings-popup">
        {this.menuItemContents().map((item, id) => {
          const cssClass = classNames("menu-item", {
            active: this.state.selected === id
          });
          return (
            <div
              key={id}
              className={cssClass}
              onMouseEnter={() => this.setState({ selected: id })}
            >
              {item}
            </div>
          );
        })}
      </div>
    );
  }
}

TableSettingsPopup.propTypes = {
  table: PropTypes.object.isRequired,
  langtag: PropTypes.string.isRequired,
  outsideClickHandler: PropTypes.func.isRequired
};

export default TableSettingsPopup;
