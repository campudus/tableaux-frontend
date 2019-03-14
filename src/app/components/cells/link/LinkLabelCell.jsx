import React from "react";
import * as f from "lodash/fp";

import PropTypes from "prop-types";

import { retrieveTranslation } from "../../../helpers/multiLanguage";
import Empty from "../../helperComponents/emptyEntry";

const LinkLabelCell = props => {
  const { langtag, displayValue } = props;
  const linkName = f.isEmpty(displayValue)
    ? null
    : retrieveTranslation(langtag, displayValue);

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
