import { Column, Row } from "../../types/grud";
import f from "lodash/fp";
import getDisplayValue from "../../helpers/getDisplayValue";
import BooleanCell from "./cells/BooleanCell";
import { ReactElement } from "react";
import { Link } from "react-router-dom";
import ArrayCell from "./cells/ArrayCell";
import TextCell from "./cells/TextCell";

type CellValueLinkProps = {
  langtag: string;
  column: Column;
  columnIndex: number;
  row: Row;
  link: string;
};

export default function CellValueLink({
  langtag,
  column,
  columnIndex,
  row,
  link
}: CellValueLinkProps): ReactElement {
  const rowValue =
    row.values.length > 1
      ? row?.values.at(columnIndex)
      : row.values[columnIndex];

  const value = getDisplayValue(column)(rowValue);

  function renderCellValue(): ReactElement {
    if (f.isBoolean(rowValue)) {
      return <BooleanCell langtag={langtag} value={rowValue} />;
    }

    if (Array.isArray(value)) {
      return <ArrayCell langtag={langtag} values={value} />;
    }

    return <TextCell langtag={langtag} value={value} />;
  }

  return (
    <Link className="cell-value-link" to={link}>
      {renderCellValue()}
    </Link>
  );
}
