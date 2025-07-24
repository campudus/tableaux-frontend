/* eslint-disable @typescript-eslint/no-explicit-any */
import { ConcatColumn, LinkColumn } from "@grud/devtools/types";
import { ReactElement, ReactNode } from "react";
import getDisplayValue from "../../../helpers/getDisplayValue";
import f from "lodash/fp";

type LinkCellProps = {
  langtag: string;
  column: LinkColumn;
  values: Record<string, any>[];
};

export default function LinkCell({
  langtag,
  column,
  values
}: LinkCellProps): ReactElement {
  function renderLinkValues(): ReactNode {
    if (!values || values.length === 0) {
      return <span>Leer</span>;
    }

    if (column.toColumn.kind !== "concat" && !column.multilanguage) {
      return values.map(entry => (
        <a
          key={entry.id}
          className="link-cell__item"
          href={`/${langtag}/tables/${column.toTable}/columns/${column.toColumn.id}/rows/${entry.id}`}
        >
          {entry.value || "Leer"}
        </a>
      ));
    }

    if (column.toColumn.kind !== "concat" && column.multilanguage) {
      return values.map(entry => (
        <a
          key={entry.id}
          className="link-cell__item"
          href={`/${langtag}/tables/${column.toTable}/columns/${column.toColumn.id}/rows/${entry.id}`}
        >
          {entry.value[langtag] || "Leer"}
        </a>
      ));
    }

    if (column.toColumn.kind === "concat") {
      return values.map(entry => {
        return entry.value.map((value: any, index: number) => {
          const currentColumn = (column.toColumn as ConcatColumn).concats.at(
            index
          );
          const link = `/${langtag}/tables/${column.toTable}/columns/${currentColumn?.id}/rows/${entry.id}`;

          if (Array.isArray(value)) {
            let displayValue = getDisplayValue(currentColumn)(value);

            if (Array.isArray(displayValue)) {
              displayValue = displayValue.map(v => v[langtag]).join(", ");
            } else {
              displayValue = displayValue[langtag];
            }

            return (
              <a
                key={`${entry.id}-${index}`}
                className="link-cell__item"
                href={link}
              >
                {f.isEmpty(displayValue) ? "Leer" : displayValue}
              </a>
            );
          }

          return (
            <a
              key={`${entry.id}-${index}`}
              className="link-cell__item"
              href={link}
            >
              {f.isEmpty(value)
                ? "Leer"
                : currentColumn?.multilanguage
                ? value[langtag]
                : value}
            </a>
          );
        });
      });
    }

    return <span>Leer</span>;
  }

  return <div className="link-cell">{renderLinkValues()}</div>;
}
