/* eslint-disable @typescript-eslint/no-explicit-any */
import { ConcatColumn, LinkColumn } from "@grud/devtools/types";
import { ReactElement, ReactNode } from "react";
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
          className={`link-cell__item preview-cell-value-link ${setEmptyClassName(
            values
          )}`}
          href={link}
        >
          {"Leer"}
        </a>
      );
    }

    if (column.toColumn.kind !== "concat") {
      return values.map((entry, index) => {
        const currentColumn = column.toColumn;
        const link = `/${langtag}/tables/${column.toTable}/columns/${currentColumn.id}/rows/${entry.id}`;

        return (
          <LinkCellItem
            key={`${entry.id}-${index}`}
            langtag={langtag}
            column={currentColumn}
            value={entry.value}
            link={link}
            path={[
              column.displayName[langtag],
              currentColumn.displayName[langtag]
            ]}
            isLast={index === values.length - 1}
          />
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
              path={[
                column.displayName[langtag],
                currentColumn.displayName[langtag]
              ]}
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
