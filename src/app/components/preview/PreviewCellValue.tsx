/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  Attachment,
  Column,
  CurrencyColumn,
  LinkColumn,
  Row,
  UnionColumn
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
  isTitle?: boolean;
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
  row,
  langtag,
  link,
  value,
  isTitle
}: {
  column: Column;
  row: Row;
  langtag: string;
  link: string;
  value: any;
  isTitle?: boolean;
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
      if ((column as UnionColumn).originColumns) {
        const originColumn = (column as UnionColumn).originColumns?.find(
          oc => oc.tableId === row.tableId
        )?.column;

        if (originColumn) {
          column = originColumn;
        }
      }

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
      return (
        <TextCell
          langtag={langtag}
          column={column}
          multilangValue={displayValue}
          isTitle={isTitle}
        />
      );
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
  link,
  isTitle
}: PreviewCellValueProps): ReactElement {
  const preventLink = [ColumnKind.link, ColumnKind.attachment].includes(
    column.kind
  );
  const Preview = preventLink ? PreviewWithoutLink : PreviewWithLink;

  return (
    <Preview href={link}>
      <PreviewContent
        column={column}
        row={row}
        langtag={langtag}
        link={link}
        value={row.values}
        isTitle={isTitle}
      />
    </Preview>
  );
}
