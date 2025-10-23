import { withProps } from "recompose";
import React from "react";
import * as f from "lodash/fp";
import i18n from "i18next";

import PropTypes from "prop-types";

import { retrieveTranslation } from "../../../helpers/multiLanguage";
import { when } from "../../../helpers/functools";
import Empty from "../../helperComponents/emptyEntry";
import LinkList from "../../helperComponents/LinkList";
import { canUserChangeCell } from "../../../helpers/accessManagementHelper";

const LinkView = ({
  langtag,
  cell,
  cell: { value },
  actions,
  linkList,
  children
}) =>
  f.isEmpty(linkList) ? (
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
      />
      {children}
    </div>
  );

LinkView.propTypes = {
  langtag: PropTypes.string.isRequired,
  cell: PropTypes.object.isRequired,
  actions: PropTypes.object.isRequired
};

const mkLinkList = (cell, langtag) => {
  const translate = when(f.isPlainObject, retrieveTranslation(langtag));
  return cell.value.map((link, idx) => {
    const displayName = translate(cell.displayValue[idx]) || (
      <Empty langtag={langtag} />
    );

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
      hiddenByRowPermissions: link.hiddenByRowPermissions
    };
  });
};

export default withProps(({ value, grudData, cell, langtag }) => {
  const linkList = mkLinkList(cell, langtag);
  try {
    const displayValues = grudData.displayValues[cell.column.toTable];
    const linkDisplayValues = value.map(({ id }) => {
      const displayValueObject = f.find(f.propEq("id", id), displayValues);
      return displayValueObject.values[0];
    });
    return { displayValues: linkDisplayValues, linkList };
  } catch (err) {
    // Worker is not done creating display values
    return { displayValues: cell.displayValue || [], linkList };
  }
})(LinkView);
