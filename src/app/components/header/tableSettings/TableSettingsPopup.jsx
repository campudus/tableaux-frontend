/*
 * Content for the TableSettings menu. Entries are individual React items with specific functions.
 */

import React, { PureComponent } from "react";
import NameEditor from "./NameEditor";
import listensToClickOutside from "react-onclickoutside";
import { isUserAdmin } from "../../../helpers/accessManagementHelper";
import i18n from "i18next";
import classNames from "classnames";
import { setRowAnnotation } from "../../../helpers/annotationHelper";
import Cookies from "js-cookie";
import PropTypes from "prop-types";

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
      actions: { setAllRowsFinal }
    } = this.props;
    return [
      <a href="#" onClick={() => setAllRowsFinal(table)}>
        {i18n.t("table:final.set_all_rows_final")}
      </a>,
      isUserAdmin() ? <NameEditor table={table} langtag={langtag} /> : null
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

module.exports = TableSettingsPopup;
