/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { ReactElement, ReactNode, useState } from "react";
import { ConcatColumn, LinkColumn } from "../../../../types/grud";
import LinkCellItem from "./LinkCellItem";

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

  const showToggleButton = values.length > MAX_VARIANT_LENGTH;
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
      const currentColumn = column.concats.at(index)!;
      const link = `/${langtag}/tables/${toTable}/columns/${currentColumn.id}/rows/${entryId}`;

      return (
        <LinkCellItem
          key={`${entryId}-${index}`}
          langtag={langtag}
          column={currentColumn}
          value={value}
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

      {showToggleButton && (
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
