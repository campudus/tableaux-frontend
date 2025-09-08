/* eslint-disable @typescript-eslint/no-explicit-any */
import { Attachment, Column, Row } from "../../types/grud";
import f from "lodash/fp";
import getDisplayValue from "../../helpers/getDisplayValue";
import BooleanCell from "./cells/BooleanCell";
import { ReactElement } from "react";
import TextCell from "./cells/TextCell";
import AttachmentCell from "./cells/AttachmentCell";
import CurrencyCell from "./cells/CurrencyCell";
import LinkCell from "./cells/LinkCell/LinkCell";

type PreviewCellValueProps = {
  langtag: string;
  column: Column;
  row: Row;
  link: string;
};

export default function PreviewCellValue({
  langtag,
  column,
  row,
  link
}: PreviewCellValueProps): ReactElement {
  function renderSingleLinkCell(): ReactElement {
    const rowValue = row.values;
    const value = getDisplayValue(column)(rowValue);

    if (f.isBoolean(rowValue)) {
      return <BooleanCell value={rowValue} />;
    }

    if (column.kind === "currency") {
      return (
        <CurrencyCell
          langtag={langtag}
          column={column}
          values={(rowValue as unknown) as Record<string, number>}
        />
      );
    }

    return <TextCell langtag={langtag} value={value} />;
  }

  return (
    <div className="preview-cell-value">
      {column.kind === "link" ? (
        <LinkCell
          langtag={langtag}
          column={column}
          values={row.values as Record<string, any>[]}
          link={link}
        />
      ) : column.kind === "attachment" ? (
        <AttachmentCell
          langtag={langtag}
          attachments={row.values as Attachment[]}
          link={link}
        />
      ) : (
        <a className="preview-cell-value-link" href={link}>
          {renderSingleLinkCell()}
        </a>
      )}
    </div>
  );
}
