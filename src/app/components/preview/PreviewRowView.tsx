import { ReactElement, useState } from "react";
import actionTypes from "../../redux/actionTypes";
import { useDispatch } from "react-redux";
import { getColumnDisplayName } from "../../helpers/multiLanguage";
import PreviewCellValue from "./PreviewCellValue";
import { buildClassName } from "../../helpers/buildClassName";
import { ColumnAndRow } from "./helper";
import { attributeKeys, isPreviewTitle } from "./attributes";
import f from "lodash/fp";
import Notifier from "./Notifier";
import { setRowFlag } from "../../redux/actions/annotationActions";
import { Row } from "../../types/grud";
import i18n from "i18next";

const { PREVIEW_TITLE } = attributeKeys;

type PreviewRowViewProps = {
  langtag: string;
  tableId: number;
  columnId: number | undefined;
  row: Row;
  columnsAndRow: ColumnAndRow[];
};

export default function PreviewRowView({
  langtag,
  tableId,
  row,
  columnId,
  columnsAndRow
}: PreviewRowViewProps): ReactElement {
  const dispatch = useDispatch();
  const [isRowFinal, setIsRowFinal] = useState(row.final);

  const handleColumnSelection = (columnId: number, rowId: number) => {
    const newUrl = `/${langtag}/preview/${tableId}/columns/${columnId}/rows/${rowId}`;
    window.history.replaceState({}, "", newUrl);

    dispatch({
      type: actionTypes.preview.PREVIEW_SET_CURRENT_COLUMN,
      currentColumn: columnId
    });
  };

  function getPreviewTitle(columnsAndRows: ColumnAndRow[]) {
    const previewTitles = columnsAndRows.filter(({ column }) =>
      isPreviewTitle(column)
    );

    if (previewTitles.length === 0) {
      return undefined;
    }

    const previewTitlesSorted = f.sortBy(
      item => item.column.attributes?.[PREVIEW_TITLE]?.value,
      previewTitles
    );

    return previewTitlesSorted.map(({ column, row }) => (
      <PreviewCellValue
        key={column.id}
        langtag={langtag}
        column={column}
        row={row}
        link={`/${langtag}/tables/${tableId}/columns/${column.id}/rows/${row.id}`}
      />
    ));
  }

  function handleUpdateRowFinalStatus() {
    const newFinalStatus = !isRowFinal;

    dispatch(
      setRowFlag({
        table: { id: tableId },
        row: { id: row.id },
        flagName: "final",
        flagValue: newFinalStatus,
        onSuccess: setIsRowFinal(newFinalStatus),
        onError: (err: unknown) => {
          console.error("Error updating row final status:", err);
        }
      })
    );
  }

  const previewTitle = getPreviewTitle(columnsAndRow);

  return (
    <div className="preview-row-view">
      <div className="preview-row-view__header">
        <Notifier
          className="preview-row-view__notifier"
          icon={<i className={`fa ${isRowFinal ? "fa-lock" : "fa-unlock"} `} />}
          label={
            isRowFinal
              ? i18n.t("preview:row_is_final")
              : i18n.t("preview:row_is_not_final")
          }
          button={
            <button onClick={handleUpdateRowFinalStatus}>
              {isRowFinal
                ? i18n.t("preview:unlock_row")
                : i18n.t("preview:lock_row")}
            </button>
          }
          color={isRowFinal ? "dark" : "orange"}
        />

        {row.archived && (
          <Notifier
            className="preview-row-view__archived-notifier"
            icon={<i className="fa fa-archive" />}
            label={i18n.t("preview:row_is_archived")}
          />
        )}
      </div>

      {previewTitle && (
        <div className="preview-row-view__title">{previewTitle}</div>
      )}

      <table>
        <tbody>
          {columnsAndRow
            .filter(({ column }) => !isPreviewTitle(column))
            .map(({ column, row }) => {
              const cellLink = `/${langtag}/tables/${tableId}/columns/${column.id}/rows/${row.id}`;

              return (
                <tr
                  key={column.id}
                  className={buildClassName("preview-row-view__row", {
                    selected: columnId === column.id
                  })}
                >
                  <td className="preview-row-view__column preview-row-view__column-selection">
                    {(column.kind === "link" || column.kind === "richtext") && (
                      <input
                        type="radio"
                        name="column-selection"
                        checked={columnId === column.id}
                        onChange={() =>
                          handleColumnSelection(column.id, row.id)
                        }
                      />
                    )}
                  </td>

                  <td className="preview-row-view__column preview-row-view__column-name">
                    <a href={cellLink}>
                      {getColumnDisplayName(column, langtag)}
                    </a>
                  </td>

                  <td className="preview-row-view__column preview-row-view__column-value">
                    <PreviewCellValue
                      langtag={langtag}
                      column={column}
                      row={row}
                      link={cellLink}
                    />
                  </td>
                </tr>
              );
            })}
        </tbody>
      </table>
    </div>
  );
}
