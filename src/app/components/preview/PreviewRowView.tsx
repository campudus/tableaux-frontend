import { ReactElement } from "react";
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
import { previewUrl } from "../../helpers/apiUrl";
import { canUserEditRowAnnotations } from "../../helpers/accessManagementHelper";

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

  const handleColumnSelection = (columnId: number, rowId: number) => {
    const newUrl = previewUrl({ langtag, tableId, columnId, rowId });
    window.history.replaceState({}, "", newUrl);

    dispatch({
      type: actionTypes.preview.PREVIEW_SET_CURRENT_COLUMN,
      currentColumn: columnId
    });

    const newColumn = columnsAndRow.find(c => c.column.id === columnId)?.column;

    if (newColumn?.kind === "link") {
      dispatch({
        type: actionTypes.preview.PREVIEW_SET_CURRENT_DETAIL_TABLE,
        currentDetailTable: newColumn.toTable
      });
    } else {
      dispatch({
        type: actionTypes.preview.PREVIEW_SET_CURRENT_DETAIL_TABLE,
        currentDetailTable: undefined
      });
    }
  };

  const getPreviewTitle = (columnsAndRows: ColumnAndRow[]) => {
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
  };

  const handleUpdateRowFinalStatus = () => {
    if (!canUserEditRowAnnotations({ row })) return;

    dispatch(
      setRowFlag({
        table: { id: tableId },
        row: { id: row.id },
        flagName: "final",
        flagValue: !row.final,
        onError: (err: unknown) => {
          console.error("Error updating row final status:", err);
        }
      })
    );
  };

  const previewTitle = getPreviewTitle(columnsAndRow);

  return (
    <div className="preview-row-view">
      <div className="preview-row-view__header">
        <Notifier
          className="preview-row-view__notifier"
          icon={<i className={`fa ${row.final ? "fa-lock" : "fa-unlock"} `} />}
          label={
            row.final
              ? i18n.t("preview:row_is_final")
              : i18n.t("preview:row_is_not_final")
          }
          button={
            <button
              onClick={handleUpdateRowFinalStatus}
              disabled={!canUserEditRowAnnotations({ row })}
            >
              {row.final
                ? i18n.t("preview:unlock_row")
                : i18n.t("preview:lock_row")}
            </button>
          }
          color={row.final ? "dark" : "orange"}
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
