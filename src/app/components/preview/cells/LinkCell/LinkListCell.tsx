/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { ReactElement, useState } from "react";
import { ConcatColumn, LinkColumn } from "../../../../types/grud";
import LinkCellItem from "./LinkCellItem";
import i18n from "i18next";
import apiUrl from "../../../../helpers/apiUrl";
import { getColumnDisplayName } from "../../../../helpers/multiLanguage";

type LinkListCellProps = {
  langtag: string;
  linkColumn: LinkColumn;
  values: Record<string, any>[];
};

const MAX_ENTRIES_LENGTH = 10;

const LinkValues = ({
  langtag,
  linkColumn,
  values,
  entryId
}: {
  langtag: string;
  linkColumn: LinkColumn;
  values: any[];
  entryId: number;
}) => {
  const concatColumn = linkColumn.toColumn as ConcatColumn;
  return (
    <>
      {values.map((value: any, index: number) => {
        const currentColumn = concatColumn.concats.at(index)!;
        return (
          <LinkCellItem
            key={`${entryId}-${index}`}
            langtag={langtag}
            column={currentColumn}
            value={value}
            link={apiUrl({
              langtag,
              tableId: linkColumn.toTable,
              columnId: currentColumn.id,
              rowId: entryId
            })}
            path={[
              getColumnDisplayName(linkColumn, langtag),
              getColumnDisplayName(currentColumn, langtag)
            ]}
            isLast={index === values.length - 1}
          />
        );
      })}
    </>
  );
};

export default function LinkListCell({
  langtag,
  linkColumn,
  values
}: LinkListCellProps): ReactElement {
  const [showAll, setShowAll] = useState(false);

  const addIndexNumber = (index: number): string => {
    return index >= 10 ? index.toString() : `0${index}`;
  };

  const showToggleButton = values.length > MAX_ENTRIES_LENGTH;
  const displayedValues = showAll
    ? values
    : values.slice(0, MAX_ENTRIES_LENGTH);

  return (
    <div className="link-list-cell">
      {displayedValues.map((entry, entryIndex) => {
        return (
          <div key={entry.id} className="link-list-cell__entry">
            {addIndexNumber(entryIndex + 1)}. &nbsp;
            <LinkValues
              langtag={langtag}
              linkColumn={linkColumn}
              values={entry.value}
              entryId={entry.id}
            />
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
          <span>
            {showAll ? i18n.t("preview:show_less") : i18n.t("preview:show_all")}
          </span>
        </button>
      )}
    </div>
  );
}
