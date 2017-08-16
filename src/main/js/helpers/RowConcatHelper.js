import Empty from "../components/helperComponents/emptyEntry";
import f from "lodash/fp";
import React, {PropTypes} from "react";

const rowConcatString = (row, langtag) => {
  if (!row.cells || !row.cells.at) {
    console.error("The object does not seem to be a valid row:", row);
  }
  const firstCell = row.cells.at(0);
  return (firstCell.displayValue[langtag]);
};

const RowConcat = (props) => {
  const {row, langtag} = props;
  const displayValue = rowConcatString(row, langtag);
  return (f.isEmpty(displayValue))
    ? <Empty />
    : <span className="row-concat-string">{displayValue}</span>;
};

RowConcat.propTypes = {
  row: PropTypes.object.isRequired,
  langtag: PropTypes.string.isRequired
};

export {rowConcatString};
export default RowConcat;
