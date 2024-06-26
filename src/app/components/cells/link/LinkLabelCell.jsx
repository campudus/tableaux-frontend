import React from "react";
import * as f from "lodash/fp";
import PropTypes from "prop-types";
import { retrieveTranslation } from "../../../helpers/multiLanguage";
import getDisplayValue from "../../../helpers/getDisplayValue";
import Empty from "../../helperComponents/emptyEntry";
import PermissionDenied from "../../helperComponents/PermissionDenied";
import { isLinkArchived } from "../../../archivedRows";
import { buildClassName } from "../../../helpers/buildClassName";

const LinkLabelCell = props => {
  const {
    langtag,
    displayValue,
    cell: { column },
    value
  } = props;
  const linkName = f.isEmpty(displayValue)
    ? retrieveTranslation(langtag, f.first(getDisplayValue(column, [value])))
    : retrieveTranslation(langtag, displayValue);

  const isArchived = isLinkArchived(value);

  const cssClass = buildClassName("link-label", { archived: isArchived });

  return (
    <button className={cssClass}>
      <div className="label-text">
        {value.hiddenByRowPermissions ? (
          <PermissionDenied />
        ) : f.isEmpty(linkName) ? (
          <Empty />
        ) : (
          linkName
        )}
      </div>
    </button>
  );
};

LinkLabelCell.propTypes = {
  value: PropTypes.object.isRequired,
  displayValue: PropTypes.object,
  displayValues: PropTypes.array,
  cell: PropTypes.object.isRequired,
  langtag: PropTypes.string.isRequired
};

export default LinkLabelCell;
