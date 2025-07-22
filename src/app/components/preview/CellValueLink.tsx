import { Attachment, Column, Row } from "../../types/grud";
import f from "lodash/fp";
import getDisplayValue from "../../helpers/getDisplayValue";
import BooleanCell from "./cells/BooleanCell";
import { ReactElement } from "react";
import ArrayCell from "./cells/ArrayCell";
import TextCell from "./cells/TextCell";
import AttachmentCell from "./cells/AttachmentCell";
import VariantCell from "./cells/VariantCell";

type CellValueLinkProps = {
  langtag: string;
  column: Column;
  row: Row;
  link: string;
};

export default function CellValueLink({
  langtag,
  column,
  row,
  link
}: CellValueLinkProps): ReactElement {
  const rowValue = row.values;
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

  return column.name === "variant" && column.kind === "link" ? (
    <div className="cell-variant-link">
      <VariantCell langtag={langtag} values={value} link={link} />
    </div>
  ) : column.kind === "attachment" ? (
    <div className="cell-attachemnt-link">
      <AttachmentCell attachemnts={rowValue as Attachment[]} link={link} />
    </div>
  ) : (
    <a className="cell-value-link" href={link}>
      {renderCellValue()}
    </a>
  );
}
