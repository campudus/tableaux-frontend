import Empty from "../components/helperComponents/emptyEntry";
import f from "lodash/fp";
import React from "react";
import PropTypes from "prop-types";
import getDisplayValue from "./getDisplayValue";

const rowConcatString = (idColumn, row, langtag) => {
  const firstCell = f.get(["values", 0], row);
  const displayValue = getDisplayValue(idColumn, firstCell);

  const arrayConcatForLang = langtag =>
    f.flow(
      f.map(f.get(langtag)),
      f.join(" ")
    )(displayValue);
  return f.isArray(displayValue)
    ? arrayConcatForLang(langtag)
    : displayValue[langtag];
};

const RowConcat = props => {
  const { idColumn, row, langtag } = props;
  const displayValue = rowConcatString(idColumn, row, langtag);
  return f.isEmpty(displayValue) ? (
    <Empty />
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
