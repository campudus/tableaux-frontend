import { ReactElement, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import f from "lodash/fp";
import { GRUDStore, Row } from "../../../types/grud";
import { ColumnAndRow, ColumnAndRows, combineColumnsAndRows } from "../helper";
import LinkedEntrySelection from "../LinkedEntrySelection";
import { buildClassName } from "../../../helpers/buildClassName";
import { getColumnDisplayName } from "../../../helpers/multiLanguage";
import PreviewCellValue from "../PreviewCellValue";
import getDisplayValue from "../../../helpers/getDisplayValue";
import actionTypes from "../../../redux/actionTypes";
import {
  isPreviewImage,
  isStickyColumn,
  sortColumnsAndRows
} from "../attributes";
import Chip from "../../Chip/Chip";
import i18n from "i18next";
import actions from "../../../redux/actionCreators";
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

  // load all linked rows that are not yet loaded
  useEffect(() => {
    linkedCells.forEach(row => {
      if (!rows?.find(r => r.id === row.id)) {
        dispatch(
          actions.fetchSingleRow({
            tableId: currentDetailTable,
            selectedRowId: row.id
          })
        );
      }
    });
  }, [currentDetailTable, linkedCells]);

  useEffect(() => {
    dispatch({
      type: actionTypes.preview.PREVIEW_SET_LINKED_SELECTION,
      selectedLinkedEntries: linkedCells.map(entry => entry.id)
    });
  }, [linkedCells]);

  const linkedCellIds = new Set(f.map("id", linkedCells));
  const linkedRows = rows?.filter(row => linkedCellIds.has(row.id));

  const selectedLinkedRows =
    selectedLinkedEntries && selectedLinkedEntries.length > 0
      ? linkedRows?.filter(row => selectedLinkedEntries?.includes(row.id))
      : [];

  const columnsAndRows = combineColumnsAndRows(columns, selectedLinkedRows);
  const columnsAndRowsSorted = sortColumnsAndRows(columnsAndRows);

  const getColumnsWithDifferences = (
    columnsAndRows: ColumnAndRows[],
    langtag: string
  ): ColumnAndRows[] => {
    return columnsAndRows.filter(({ column, rows }) => {
      const firstValue = getDisplayValue(column)(rows[0]?.values);
      const firstDisplay = Array.isArray(firstValue)
        ? firstValue.map(v => v[langtag]).join(", ")
        : firstValue[langtag];

      const hasDifference = rows.some(row => {
        const value = getDisplayValue(column)(row.values);
        const display = Array.isArray(value)
          ? value.map(v => v[langtag]).join(", ")
          : value[langtag];

        return display !== firstDisplay;
      });

      return hasDifference;
    });
  };

  const columnsToDisplay = showDifferences
    ? getColumnsWithDifferences(columnsAndRowsSorted, langtag)
    : columnsAndRowsSorted;

  const previewImageColumn = columnsToDisplay.find(columnAndRow =>
    isPreviewImage(columnAndRow.column)
  );

  function isArchivedRow(row: Row): boolean {
    return linkedCells.find(c => c.id === row.id)?.archived || false;
  }

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
            <button
              className="detail-view-link__checkbox"
              onClick={() => handleSelectAll(!selectAll)}
            >
              <input type="checkbox" defaultChecked={selectAll} />
              <label>{i18n.t("preview:select_all")}</label>
            </button>

            <button
              className="detail-view-link__checkbox"
              onClick={() => setShowDifferences(!showDifferences)}
              disabled={
                !(selectedLinkedEntries && selectedLinkedEntries.length >= 2)
              }
            >
              <input type="checkbox" defaultChecked={showDifferences} />
              <label>{i18n.t("preview:show_differences")}</label>
            </button>
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
                        src={"/api" + row.values.at(0).url[langtag]}
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

                    <div>{row.values.at(0).title[langtag]}</div>
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
