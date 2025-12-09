import { ReactElement, useCallback, useState } from "react";
import f from "lodash/fp";
import { useDebouncedValue } from "../../helpers/useDebouncedValue";
import Tooltip from "../helperComponents/Tooltip/Tooltip";
import { ColumnAndRow } from "./helper";

import { attributeKeys, isPreviewTitle } from "./attributes";
import getDisplayValue from "../../helpers/getDisplayValue";
import apiUrl from "../../helpers/apiUrl";
import PreviewCellValue from "./PreviewCellValue";
import { getColumnDisplayName } from "../../helpers/multiLanguage.jsx";

export type PreviewDefaultTitle = {
  value: string;
  link: string;
  columnDisplayName?: string;
};

type PreviewTitleProps = {
  langtag: string;
  tableId: number;
  columnsAndRow: ColumnAndRow[];
  defaultTitle: PreviewDefaultTitle | undefined;
};

export default function PreviewTitle({
  langtag,
  tableId,
  columnsAndRow,
  defaultTitle
}: PreviewTitleProps): ReactElement | null {
  const previewTitles = columnsAndRow.filter(({ column }) =>
    isPreviewTitle(column)
  );

  if (previewTitles.length === 0 && !defaultTitle) {
    return null;
  }

  return (
    <div className="preview-title">
      <PreviewTitleContent
        langtag={langtag}
        tableId={tableId}
        previewTitles={previewTitles}
        defaultTitle={defaultTitle}
      />
    </div>
  );
}

type PreviewTitleContentProps = Omit<PreviewTitleProps, "columnsAndRow"> & {
  previewTitles: ColumnAndRow[];
};

function PreviewTitleContent({
  langtag,
  tableId,
  previewTitles,
  defaultTitle
}: PreviewTitleContentProps) {
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const debouncedTooltipVisible = useDebouncedValue(tooltipVisible, 600);
  const isVisible = tooltipVisible && debouncedTooltipVisible; // delay on open, but close instantly
  const handleMouseEnter = useCallback(() => setTooltipVisible(true), []);
  const handleMouseLeave = useCallback(() => setTooltipVisible(false), []);

  if (previewTitles.length === 0 && defaultTitle) {
    return (
      <div
        className="preview-title__element"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <a href={defaultTitle.link}>
          <span>{defaultTitle.value}</span>
        </a>

        {isVisible && (
          <Tooltip defaultInvert style={{ left: "10px", fontSize: "13px" }}>
            {defaultTitle.columnDisplayName}
          </Tooltip>
        )}
      </div>
    );
  }

  const previewTitlesSorted = f.sortBy(
    item => item.column.attributes?.[attributeKeys.PREVIEW_TITLE]?.value,
    previewTitles
  );

  return (
    <>
      {previewTitlesSorted.map(({ column, row }) => {
        if (column.kind === "boolean") {
          const displayValue = getDisplayValue(column)(row.values)[langtag];
          return displayValue ? (
            <div
              className="preview-title__element"
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
              key={column.id}
            >
              <a
                className="preview-cell-value"
                href={apiUrl({
                  langtag,
                  tableId,
                  columnId: column.id,
                  rowId: row.id
                })}
              >
                {displayValue}
              </a>

              {isVisible && (
                <Tooltip
                  defaultInvert
                  style={{ left: "10px", fontSize: "13px" }}
                >
                  {getColumnDisplayName(column, langtag)}
                </Tooltip>
              )}
            </div>
          ) : null;
        }

        return (
          <PreviewCellValue
            key={column.id}
            langtag={langtag}
            column={column}
            row={row}
            link={apiUrl({
              langtag,
              tableId,
              columnId: column.id,
              rowId: row.id
            })}
            isTitle={true}
          />
        );
      })}
    </>
  );
}
