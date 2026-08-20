/* eslint-disable @typescript-eslint/no-explicit-any */
import { ConcatColumn, LinkColumn } from "@grud/devtools/types";
import { ReactElement } from "react";
import { getEmptyClassName } from "../../helper";
import LinkListCell from "./LinkListCell";
import LinkCellItem from "./LinkCellItem";
import i18n from "i18next";
import apiUrl from "../../../../helpers/apiUrl";
import { getColumnDisplayName } from "../../../../helpers/multiLanguage";
import { usesLinkAttributeFormat } from "../../../../helpers/linkAttributes";

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

// One item per entry. A link column carrying its own formatPattern resolves
// the whole entry -- target display value plus this edge's attributes -- to a
// single label, which getDisplayValue does when handed the *link* column and
// a single-edge array (the same idiom LinkLabelCell.jsx uses in the grid).
// Without one, the entry shows its target column's own display value.
const SingleLinkItems = ({ langtag, column, values }: LinkCellProps) => {
  const isFormatted = usesLinkAttributeFormat(column);
  const currentColumn = column.toColumn;
  return (
    <>
      {values.map((entry, index) => (
        <LinkCellItem
          key={`${entry.id}-${index}`}
          langtag={langtag}
          column={isFormatted ? column : currentColumn}
          value={isFormatted ? [entry] : entry.value}
          link={apiUrl({
            langtag,
            tableId: column.toTable,
            columnId: currentColumn.id,
            rowId: entry.id
          })}
          path={
            isFormatted
              ? [getColumnDisplayName(column, langtag)]
              : [
                  getColumnDisplayName(column, langtag),
                  getColumnDisplayName(currentColumn, langtag)
                ]
          }
          isLast={index === values.length - 1}
        />
      ))}
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

  const isSingle =
    values.length === 1 || column.constraint?.cardinality?.to === 1;

  // A formatPattern describes the whole linked row, so its entries render as
  // one label each and never explode into the target's concat parts below.
  if (usesLinkAttributeFormat(column)) {
    return (
      <div className={cssClass}>
        {isSingle ? (
          <SingleLinkItems {...props} />
        ) : (
          <LinkListCell langtag={langtag} linkColumn={column} values={values} />
        )}
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

  if (isSingle) {
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
