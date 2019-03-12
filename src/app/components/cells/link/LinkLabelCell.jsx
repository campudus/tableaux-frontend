import React from "react";
import * as f from "lodash/fp";

import PropTypes from "prop-types";

import { retrieveTranslation } from "../../../helpers/multiLanguage";
import { when } from "../../../helpers/functools";
import Empty from "../../helperComponents/emptyEntry";

const LinkLabelCell = props => {
  const { value, langtag, displayValue, displayValues } = props;
  const { id } = value;
  const linkName = f.isEmpty(displayValues)
    ? retrieveTranslation(langtag, displayValue)
    : f.flow(
        f.find(f.propEq("id", id)),
        f.prop(["values", 0]),
        when(f.isObject, objValue => retrieveTranslation(langtag, objValue))
      )(displayValues);

  return (
    <a href="#" className="link-label">
      <div className="label-text">
        {f.isEmpty(linkName) ? <Empty langtag={langtag} /> : linkName}
      </div>
    </a>
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
