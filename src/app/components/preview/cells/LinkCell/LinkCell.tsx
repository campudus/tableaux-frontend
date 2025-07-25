/* eslint-disable @typescript-eslint/no-explicit-any */
import { ConcatColumn, LinkColumn } from "@grud/devtools/types";
import { ReactElement, ReactNode } from "react";
import React from "react";
import { setEmptyClassName } from "../../helper";
import LinkListCell from "./LinkListCell";
import LinkCellItem from "./LinkCellItem";

type LinkCellProps = {
  langtag: string;
  column: LinkColumn;
  values: Record<string, any>[];
  link: string;
};

export default function LinkCell({
  langtag,
  column,
  values,
  link
}: LinkCellProps): ReactElement {
  function renderLinkCell(): ReactNode {
    if (!values || values.length === 0) {
      return (
        <a
          className={`link-cell__item ${setEmptyClassName(values)}`}
          href={link}
        >
          {"Leer"}
        </a>
      );
    }

    if (column.toColumn.kind !== "concat") {
      return values.map((entry, index) => {
        const value = column.multilanguage ? entry.value[langtag] : entry.value;

        return (
          <React.Fragment key={entry.id}>
            <a
              className={`link-cell__item ${setEmptyClassName(value)}`}
              href={`/${langtag}/tables/${column.toTable}/columns/${column.toColumn.id}/rows/${entry.id}`}
            >
              {value || "Leer"}
            </a>

            {index < values.length - 1 && (
              <span className="array-cell__separator">&bull;</span>
            )}
          </React.Fragment>
        );
      });
    }

    if (
      (column.toColumn.kind === "concat" &&
        column.constraint?.cardinality?.to === 1) ||
      values.length === 1
    ) {
      return values.map(entry => {
        return entry.value.map((value: any, index: number) => {
          const currentColumn = (column.toColumn as ConcatColumn).concats.at(
            index
          )!;
          const link = `/${langtag}/tables/${column.toTable}/columns/${currentColumn.id}/rows/${entry.id}`;

          return (
            <LinkCellItem
              key={`${entry.id}-${index}`}
              langtag={langtag}
              column={currentColumn}
              value={value}
              link={link}
              isLast={index === entry.value.length - 1}
            />
          );
        });
      });
    }

    return <LinkListCell langtag={langtag} column={column} values={values} />;
  }

  return <div className="link-cell">{renderLinkCell()}</div>;
}
