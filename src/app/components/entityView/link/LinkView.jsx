import React from "react";
import * as f from "lodash/fp";
import i18n from "i18next";

import PropTypes from "prop-types";

import { retrieveTranslation } from "../../../helpers/multiLanguage";
import LinkList from "../../helperComponents/LinkList";
import { canUserChangeCell } from "../../../helpers/accessManagementHelper";
import { withForeignDisplayValues } from "../../helperComponents/withForeignDisplayValues";

const LinkView = ({
  langtag,
  cell,
  cell: { value },
  actions,
  children,
  foreignDisplayValues
}) => {
  const linkList = cell.value.map((link, idx) => {
    const fallback = `(${i18n.t("common:empty").toUpperCase()})`;
    const displayValue = foreignDisplayValues[idx] ?? cell.displayValue[idx];
    const displayName = f.isArray(displayValue)
      ? f
          .map(dv => retrieveTranslation(langtag, dv) || fallback, displayValue)
          .join(" > ")
      : retrieveTranslation(langtag, displayValue) || fallback;

    return {
      label: displayName,
      displayName,
      linkTarget: {
        tables: cell.tables,
        tableId: cell.column.toTable,
        rowId: link.id,
        langtag
      },
      id: link.id,
      value: link.value,
      attributes: link.attributes,
      hiddenByRowPermissions: link.hiddenByRowPermissions
    };
  });

  return f.isEmpty(linkList) ? (
    <div className="item-description">
      {i18n.t("table:empty.links")}
      {children}
    </div>
  ) : (
    <div>
      <LinkList
        links={linkList}
        langtag={langtag}
        cell={cell}
        actions={actions}
        value={value}
        sortable
        showToggleButton={canUserChangeCell(cell, langtag)}
        enableLinkAttributes
      />
      {children}
    </div>
  );
};

LinkView.propTypes = {
  langtag: PropTypes.string.isRequired,
  cell: PropTypes.object.isRequired,
  actions: PropTypes.object.isRequired
};

export default withForeignDisplayValues(LinkView);
