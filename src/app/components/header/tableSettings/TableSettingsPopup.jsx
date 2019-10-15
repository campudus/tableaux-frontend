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

const TableSettingsPopup = ({
  table,
  langtag,
  actions: { setAllRowsFinal, changeTableName }
}) => {
  const canEditRowAnnotations = canUserEditRowAnnotations({ table });
  const canEditTableDisplayProperty = canUserEditTableDisplayProperty({
    table
  });
  return (
    <div id="table-settings-popup">
      <button
        key="i-need-no-key"
        className={
          "menu-item " + (canEditRowAnnotations ? "" : "menu-item--disabled")
        }
        onClick={() => (canEditRowAnnotations ? setAllRowsFinal(table) : null)}
      >
        {i18n.t("table:final.set_all_rows_final")}
      </button>

      <NameEditor
        table={table}
        langtag={langtag}
        changeTableName={changeTableName}
        locked={!canEditTableDisplayProperty}
      />
    </div>
  );
};

TableSettingsPopup.propTypes = {
  table: PropTypes.object.isRequired,
  langtag: PropTypes.string.isRequired,
  handleClickOutside: PropTypes.func.isRequired
};

export default listensToClickOutside(TableSettingsPopup);
