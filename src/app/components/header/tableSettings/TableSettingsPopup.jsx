/*
 * Content for the TableSettings menu. Entries are individual React items with specific functions.
 */

import React, { PureComponent } from "react";
import i18n from "i18next";
import listensToClickOutside from "react-onclickoutside";

import PropTypes from "prop-types";

import {
  canUserEditTableDisplayProperty,
  canUserEditRowAnnotations
} from "../../../helpers/accessManagementHelper";
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

  render() {
    const {
      table,
      langtag,
      actions: { setAllRowsFinal, changeTableName }
    } = this.props;
    const canEditRowAnnotations = canUserEditRowAnnotations({ table });
    const canEditTableDisplayProperty = canUserEditTableDisplayProperty({
      table
    });
    return (
      <div id="table-settings-popup">
        <div
          className={canEditRowAnnotations ? "menu-item" : "menu-item-disabled"}
          onClick={() =>
            canEditRowAnnotations ? setAllRowsFinal(table) : null
          }
        >
          <a key="i-need-no-key" href="#">
            {i18n.t("table:final.set_all_rows_final")}
          </a>
        </div>
        <div
          className={
            canEditTableDisplayProperty ? "menu-item" : "menu-item-disabled"
          }
        >
          <NameEditor
            table={table}
            langtag={langtag}
            changeTableName={changeTableName}
            locked={!canEditTableDisplayProperty}
          />
        </div>
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
