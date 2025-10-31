import { ReactElement, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import f from "lodash/fp";
import { GRUDStore, Row } from "../../../types/grud";
import {
  ColumnAndRow,
  combineColumnsAndRows,
  getColumnsWithDifferences
} from "../helper";
import LinkedEntrySelection from "../LinkedEntrySelection";
import { buildClassName } from "../../../helpers/buildClassName";
import { getColumnDisplayName } from "../../../helpers/multiLanguage";
import PreviewCellValue from "../PreviewCellValue";
import actionTypes from "../../../redux/actionTypes";
import {
  isPreviewImage,
  isStickyColumn,
  sortColumnsAndRows
} from "../attributes";
import Chip from "../../Chip/Chip";
import i18n from "i18next";
import apiUrl from "../../../helpers/apiUrl";

type DetailViewLinkProps = {
  langtag: string;
  title: string | undefined;
  currentDetailTable: number;
  selectedColumnAndRow: ColumnAndRow;
  linkedCells: Row[];
};

export default function DetailViewLink({
  langtag,
  title,
  currentDetailTable,
  selectedColumnAndRow,
  linkedCells
}: DetailViewLinkProps): ReactElement {
  const dispatch = useDispatch();
  const [selectAll, setSelectAll] = useState(true);
  const [showDifferences, setShowDifferences] = useState(false);

  const columns = useSelector(
    (store: GRUDStore) => store.columns[currentDetailTable]?.data
  );
  const rows = useSelector(
    (store: GRUDStore) => store.rows[currentDetailTable]?.data
  );
  const selectedLinkedEntries = useSelector(
    (store: GRUDStore) => store.preview.selectedLinkedEntries
  );

  const linkedCellIds = new Set(f.map("id", linkedCells));
  const linkedRows = rows?.filter(row => linkedCellIds.has(row.id));

  const selectedLinkedRows =
    selectedLinkedEntries && selectedLinkedEntries.length > 0
      ? linkedRows?.filter(row => selectedLinkedEntries?.includes(row.id))
      : [];

  const columnsAndRows = combineColumnsAndRows(columns, selectedLinkedRows);
  const columnsAndRowsSorted = sortColumnsAndRows(columnsAndRows);

  const columnsToDisplay = showDifferences
    ? getColumnsWithDifferences(columnsAndRowsSorted, langtag)
    : columnsAndRowsSorted;

  const previewImageColumn = columnsToDisplay.find(columnAndRow =>
    isPreviewImage(columnAndRow.column)
  );

  useEffect(() => {
    const allSelected =
      selectedLinkedEntries &&
      linkedCells.length === selectedLinkedEntries.length;
    setSelectAll(allSelected || false);
  }, [selectedLinkedEntries]);

  // with this code we dynamically set the top offset for sticky rows
  // to ensure they are positioned correctly in the viewport
  // this is necessary because the height of the rows is dynamic
  useEffect(() => {
    const tableRows = document.querySelectorAll(
      ".detail-view-link__row--sticky"
    );
    let offset = 0;

    if (!tableRows || tableRows.length === 0) return;

    tableRows.forEach(row => {
      (row as HTMLElement).style.top = `${offset}px`;
      offset += (row as HTMLElement).offsetHeight;
    });
  }, [columnsToDisplay]);

  const handleSelectAll = (selectAll: boolean): void => {
    if (selectAll) {
      dispatch({
        type: actionTypes.preview.PREVIEW_SET_LINKED_SELECTION,
        selectedLinkedEntries: linkedCells.map(entry => entry.id)
      });
    } else {
      dispatch({
        type: actionTypes.preview.PREVIEW_SET_LINKED_SELECTION,
        selectedLinkedEntries: []
      });
      setShowDifferences(false);
    }

    setSelectAll(selectAll);
  };

  const isArchivedRow = (row: Row): boolean => {
    return linkedCells.find(c => c.id === row.id)?.archived || false;
  };

  if (columnsToDisplay && columnsToDisplay.length === 0) {
    return (
      <div className="preview-view__centered">
        {i18n.t("preview:warning_no_linked_entries")}
      </div>
    );
  }

  return (
    <div className="detail-view-link">
      <div className="detail-view-link__header">
        <h2 className="detail-view-link__title">
          {linkedCells.length > 1 ? `${title} (${linkedCells.length})` : title}
        </h2>

        {linkedCells.length > 1 && (
          <div className="detail-view-link__actions">
            <label
              className="detail-view-link__checkbox"
              htmlFor={`detail-link-select-all-${currentDetailTable}`}
            >
              <input
                id={`detail-link-select-all-${currentDetailTable}`}
                type="checkbox"
                checked={selectAll}
                onChange={e => handleSelectAll(e.currentTarget.checked)}
              />
              <span>{i18n.t("preview:select_all")}</span>
            </label>

            <label
              className={buildClassName("detail-view-link__checkbox", {
                disabled: !(
                  selectedLinkedEntries && selectedLinkedEntries.length >= 2
                )
              })}
              htmlFor={`detail-link-show-differences-${currentDetailTable}`}
            >
              <input
                id={`detail-link-show-differences-${currentDetailTable}`}
                type="checkbox"
                checked={showDifferences}
                onChange={e => setShowDifferences(e.currentTarget.checked)}
                disabled={
                  !(selectedLinkedEntries && selectedLinkedEntries.length >= 2)
                }
              />
              <span>{i18n.t("preview:show_differences")}</span>
            </label>
          </div>
        )}
      </div>

      {linkedCells.length > 1 && (
        <LinkedEntrySelection
          langtag={langtag}
          linkedEntries={linkedCells}
          linkedEntriesColumn={selectedColumnAndRow.column}
        />
      )}

      <div className="detail-view-link__table-wrapper">
        <table>
          {previewImageColumn && (
            <thead>
              <tr className="detail-view-link__row detail-view-link__row--header">
                <th className="detail-view-link__column detail-view-link__column-name" />
                {previewImageColumn.rows.map(row => (
                  <th
                    key={row.id}
                    className={buildClassName(
                      "detail-view-link__column detail-view-link__column-value",
                      {
                        archived: isArchivedRow(row)
                      }
                    )}
                  >
                    <div className="detail-view-link__column-image-wrapper">
                      <img
                        className="detail-view-link__column-image"
                        src={"/api" + row.values.at(0)?.url[langtag]}
                        alt="Preview"
                        onError={e => {
                          (e.currentTarget as HTMLImageElement).src =
                            "/img/preview-fallback.svg";
                          (e.currentTarget as HTMLImageElement).style.width =
                            "35px";
                        }}
                      />

                      {isArchivedRow(row) && (
                        <Chip
                          icon={<i className="fa fa-archive" />}
                          label={i18n.t("preview:archived")}
                        />
                      )}
                    </div>

                    <div>{row.values.at(0)?.title[langtag]}</div>
                  </th>
                ))}
              </tr>
            </thead>
          )}

          <tbody>
            {!columnsToDisplay}
            {columnsToDisplay.map(({ column, rows }, index) => {
              const columnLink = apiUrl({
                langtag,
                tableId: currentDetailTable,
                columnId: column.id
              });
              const rowFilter = `/rows/${selectedLinkedEntries?.at(
                0
              )}?filter:id:${selectedLinkedEntries?.join(":")}`;

              const columnNameLink = !f.isEmpty(selectedLinkedEntries)
                ? columnLink + rowFilter
                : columnLink;

              return (
                <tr
                  key={column.id}
                  className={buildClassName("detail-view-link__row", {
                    even: index % 2 === 0,
                    sticky: isStickyColumn(column)
                  })}
                >
                  <td className="detail-view-link__column detail-view-link__column-name">
                    <a href={columnNameLink}>
                      {getColumnDisplayName(column, langtag)}
                    </a>
                  </td>

                  {rows.map(row => (
                    <td
                      className="detail-view-link__column detail-view-link__column-value"
                      key={row.id}
                    >
                      <PreviewCellValue
                        langtag={langtag}
                        column={column}
                        row={row}
                        link={apiUrl({
                          langtag,
                          tableId: currentDetailTable,
                          columnId: column.id,
                          rowId: row.id
                        })}
                      />
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
