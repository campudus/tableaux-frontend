/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  Attachment,
  Column,
  CurrencyColumn,
  LinkColumn,
  Row
} from "../../types/grud";
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

const ColumnKind = {
  boolean: "boolean",
  currency: "currency",
  link: "link",
  attachment: "attachment"
};

const cssClass = "preview-cell-value";

const PreviewContent = ({
  column,
  langtag,
  link,
  value
}: {
  column: Column;
  langtag: string;
  link: string;
  value: any;
}) => {
  const displayValue = getDisplayValue(column)(value);

  switch (column.kind) {
    case ColumnKind.boolean:
      return <BooleanCell value={Boolean(value)} />;
    case ColumnKind.currency:
      return (
        <CurrencyCell
          langtag={langtag}
          column={column as CurrencyColumn}
          values={value as Record<string, number>}
        />
      );
    case ColumnKind.link:
      return (
        <LinkCell
          langtag={langtag}
          column={column as LinkColumn}
          values={value as Record<string, any>[]}
          link={link}
        />
      );
    case ColumnKind.attachment:
      return (
        <AttachmentCell
          langtag={langtag}
          attachments={value as Attachment[]}
          link={link}
        />
      );
    default:
      return <TextCell langtag={langtag} value={displayValue} />;
  }
};

const PreviewWithLink = ({
  href,
  children
}: {
  href: string;
  children: ReactElement;
}) => (
  <a className={cssClass} href={href}>
    {children}
  </a>
);

const PreviewWithoutLink = ({ children }: { children: ReactElement }) => (
  <div className={cssClass}>{children}</div>
);

export default function PreviewCellValue({
  langtag,
  column,
  row,
  link
}: PreviewCellValueProps): ReactElement {
  const preventLink = [ColumnKind.link, ColumnKind.attachment].includes(
    column.kind
  );
  const Preview = preventLink ? PreviewWithoutLink : PreviewWithLink;

  return (
    <Preview href={link}>
      <PreviewContent
        column={column}
        langtag={langtag}
        link={link}
        value={row.values}
      />
    </Preview>
  );
}
