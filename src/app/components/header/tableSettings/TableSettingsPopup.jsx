/*
 * Content for the TableSettings menu. Entries are individual React items with specific functions.
 */

import React, { useEffect, useRef } from "react";
import i18n from "i18next";

import PropTypes from "prop-types";

import {
  canUserEditTableDisplayProperty,
  canUserEditRowAnnotations
} from "../../../helpers/accessManagementHelper";
import NameEditor from "./NameEditor";
import { outsideClickEffect } from "../../../helpers/useOutsideClick";

const TableSettingsPopup = ({
  table,
  langtag,
  actions: { setAllRowsFinal, changeTableName },
  onClose
}) => {
  const container = useRef();
  const canEditRowAnnotations = canUserEditRowAnnotations({ table });
  const canEditTableDisplayProperty = canUserEditTableDisplayProperty({
    table
  });

  useEffect(
    outsideClickEffect({
      shouldListen: true,
      containerRef: container,
      onOutsideClick: onClose
    }),
    [container.current]
  );

  return (
    <div id="table-settings-popup" ref={container}>
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
};

export default TableSettingsPopup;
