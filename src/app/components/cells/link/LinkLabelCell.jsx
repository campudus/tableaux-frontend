import React from "react";
import * as f from "lodash/fp";
import PropTypes from "prop-types";
import { retrieveTranslation } from "../../../helpers/multiLanguage";
import getDisplayValue from "../../../helpers/getDisplayValue";
import Empty from "../../helperComponents/emptyEntry";
import PermissionDenied from "../../helperComponents/PermissionDenied";
import { isLinkArchived } from "../../../archivedRows";
import { buildClassName } from "../../../helpers/buildClassName";
import Tooltip from "../../helperComponents/Tooltip/TooltipWithState";
import TaxonomyPath from "./TaxonomyPath";

const LinkLabelCell = props => {
  const {
    langtag,
    displayValue,
    cell: { column },
    value,
    availableWidth
  } = props;
  const isTaxonomyPath = f.isArray(displayValue);
  const linkName = f.isEmpty(displayValue)
    ? retrieveTranslation(langtag, f.first(getDisplayValue(column, [value])))
    : isTaxonomyPath
    ? f.join(" > ", displayValue)
    : displayValue;

  const isArchived = isLinkArchived(value);

  const cssClass = buildClassName("link-label", { archived: isArchived });

  return (
    <button className={cssClass}>
      {value.hiddenByRowPermissions ? (
        <PermissionDenied />
      ) : f.isEmpty(linkName) ? (
        <Empty />
      ) : (
        <Tooltip
          className={buildClassName("label-text", {
            taxonomy: isTaxonomyPath
          })}
          tooltip={linkName}
          offsetTop={5}
        >
          {isTaxonomyPath && !f.isEmpty(displayValue) ? (
            <TaxonomyPath
              nodes={displayValue}
              availableWidth={availableWidth}
            />
          ) : (
            linkName
          )}
        </Tooltip>
      )}
    </button>
  );
};

LinkLabelCell.propTypes = {
  value: PropTypes.object.isRequired,
  displayValue: PropTypes.oneOfType([PropTypes.string, PropTypes.array]),
  displayValues: PropTypes.array,
  cell: PropTypes.object.isRequired,
  langtag: PropTypes.string.isRequired,
  availableWidth: PropTypes.number
};

export default LinkLabelCell;
