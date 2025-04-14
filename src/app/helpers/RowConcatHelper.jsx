import React from "react";
import f from "lodash/fp";

import PropTypes from "prop-types";

import { ifElse } from "./functools";
import { retrieveTranslation } from "./multiLanguage";
import Empty from "../components/helperComponents/emptyEntry";
import getDisplayValue from "./getDisplayValue";

const rowConcatString = (idColumn, row, langtag) => {
  const firstCellValue = f.get(["values", 0], row);
  const translate = retrieveTranslation(langtag);
  // links/attachments in primary column create arrays, thus failing retrieveTranslation spec
  const translateArray = f.compose(f.join(", "), f.map(translate));
  const applyTranslation = ifElse(f.isArray, translateArray, translate);

  return f.compose(applyTranslation, getDisplayValue(idColumn))(firstCellValue);
};

const RowConcat = props => {
  const { idColumn, row, langtag } = props;
  const displayValue = rowConcatString(idColumn, row, langtag);
  return f.isEmpty(displayValue) ? (
    <Empty langtag={langtag} />
  ) : (
    <span className="row-concat-string">{displayValue}</span>
  );
};

RowConcat.propTypes = {
  row: PropTypes.object.isRequired,
  langtag: PropTypes.string.isRequired,
  idColumn: PropTypes.object.isRequired
};

export { rowConcatString };
export default RowConcat;
