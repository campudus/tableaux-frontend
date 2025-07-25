/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { ReactElement, ReactNode, useState } from "react";
import f from "lodash/fp";
import { ConcatColumn, LinkColumn } from "../../../types/grud";
import getDisplayValue from "../../../helpers/getDisplayValue";
import { setEmptyClassName } from "../helper";

type LinkListCellProps = {
  langtag: string;
  column: LinkColumn;
  values: Record<string, any>[];
};

const MAX_VARIANT_LENGTH = 5;

export default function LinkListCell({
  langtag,
  column,
  values
}: LinkListCellProps): ReactElement {
  const [showAll, setShowAll] = useState(false);

  function addIndexNumber(index: number): string {
    return index >= 10 ? index.toString() : `0${index}`;
  }

  const shouldShowButton = values.length > MAX_VARIANT_LENGTH;
  const displayedValues = showAll
    ? values
    : values.slice(0, MAX_VARIANT_LENGTH);

  function renderLinkValues(
    column: ConcatColumn,
    values: any,
    toTable: number,
    entryId: number
  ): ReactNode {
    return values.map((value: any, index: number) => {
      const currentColumn = column.concats.at(index);
      const link = `/${langtag}/tables/${toTable}/columns/${currentColumn?.id}/rows/${entryId}`;

      let displayValue = value;

      if (Array.isArray(value)) {
        displayValue = getDisplayValue(currentColumn)(value);

        if (Array.isArray(displayValue)) {
          displayValue = displayValue.map(v => v[langtag]).join(" ");
        } else {
          displayValue = displayValue[langtag];
        }
      } else if (currentColumn?.multilanguage) {
        displayValue = value[langtag];
      }

      if (f.isBoolean(displayValue)) {
        displayValue = displayValue.toString();
      }

      return (
        <React.Fragment key={`${entryId}-${index}`}>
          <a
            className={`link-list-cell__item ${setEmptyClassName(
              displayValue
            )}`}
            href={link}
          >
            {displayValue || "Leer"}
          </a>

          {index < values.length - 1 && (
            <span className="link-list-cell__separator">&bull;</span>
          )}
        </React.Fragment>
      );
    });
  }

  return (
    <div className="link-list-cell">
      {displayedValues.map((entry, entryIndex) => {
        return (
          <div key={entry.id} className="link-list-cell__entry">
            {addIndexNumber(entryIndex + 1)}. &nbsp;
            {renderLinkValues(
              column.toColumn as ConcatColumn,
              entry.value,
              column.toTable,
              entry.id
            )}
          </div>
        );
      })}

      {shouldShowButton && (
        <button
          className="link-list-cell__toggle"
          onClick={() => setShowAll(prev => !prev)}
        >
          <i
            className={`fa ${showAll ? "fa-chevron-up" : "fa-chevron-down"}`}
          />
          <span>{showAll ? "Weniger anzeigen" : "Alle anzeigen"}</span>
        </button>
      )}
    </div>
  );
}
