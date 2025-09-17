/* eslint-disable @typescript-eslint/no-explicit-any */
import { ConcatColumn, LinkColumn } from "@grud/devtools/types";
import { ReactElement } from "react";
import { getEmptyClassName } from "../../helper";
import LinkListCell from "./LinkListCell";
import LinkCellItem from "./LinkCellItem";
import i18n from "i18next";
import apiUrl from "../../../../helpers/apiUrl";
import { getColumnDisplayName } from "../../../../helpers/multiLanguage";

type LinkCellProps = {
  langtag: string;
  column: LinkColumn;
  values: Record<string, any>[];
  link: string;
};

const EmptyLink = ({ link, values }: { link: string; values: any[] }) => {
  return (
    <a className={`link-cell__item ${getEmptyClassName(values)}`} href={link}>
      {i18n.t("preview:empty")}
    </a>
  );
};

const SingleLinkItems = ({ langtag, column, values }: LinkCellProps) => {
  return (
    <>
      {values.map((entry, index) => {
        const currentColumn = column.toColumn;
        return (
          <LinkCellItem
            key={`${entry.id}-${index}`}
            langtag={langtag}
            column={currentColumn}
            value={entry.value}
            link={apiUrl({
              langtag,
              tableId: column.toTable,
              columnId: currentColumn.id,
              rowId: entry.id
            })}
            path={[
              getColumnDisplayName(column, langtag),
              getColumnDisplayName(currentColumn, langtag)
            ]}
            isLast={index === values.length - 1}
          />
        );
      })}
    </>
  );
};

const ConcatSingleItems = ({ langtag, column, values }: LinkCellProps) => {
  return (
    <>
      {values.map(entry =>
        entry.value.map((value: any, index: number) => {
          const currentColumn = (column.toColumn as ConcatColumn).concats.at(
            index
          )!;
          return (
            <LinkCellItem
              key={`${entry.id}-${index}`}
              langtag={langtag}
              column={currentColumn}
              value={value}
              link={apiUrl({
                langtag,
                tableId: column.toTable,
                columnId: currentColumn.id,
                rowId: entry.id
              })}
              path={[
                getColumnDisplayName(column, langtag),
                getColumnDisplayName(currentColumn, langtag)
              ]}
              isLast={index === entry.value.length - 1}
            />
          );
        })
      )}
    </>
  );
};

const cssClass = "link-cell";

export default function LinkCell(props: LinkCellProps): ReactElement {
  const { values, column, link, langtag } = props;

  if (!values || values.length === 0) {
    return (
      <div className={cssClass}>
        <EmptyLink link={link} values={values} />
      </div>
    );
  }

  if (column.toColumn.kind !== "concat") {
    return (
      <div className={cssClass}>
        <SingleLinkItems {...props} />
      </div>
    );
  }

  if (
    (column.toColumn.kind === "concat" &&
      column.constraint?.cardinality?.to === 1) ||
    values.length === 1
  ) {
    return (
      <div className={cssClass}>
        <ConcatSingleItems {...props} />
      </div>
    );
  }

  return (
    <div className={cssClass}>
      <LinkListCell langtag={langtag} linkColumn={column} values={values} />
    </div>
  );
}
