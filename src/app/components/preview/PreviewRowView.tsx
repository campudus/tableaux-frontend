import { ReactElement } from "react";
import actionTypes from "../../redux/actionTypes";
import { useDispatch, useSelector } from "react-redux";
import { getColumnDisplayName } from "../../helpers/multiLanguage";
import PreviewCellValue from "./PreviewCellValue";
import { buildClassName } from "../../helpers/buildClassName";
import { ColumnAndRow } from "./helper";
import { isPreviewTitle } from "./attributes";
import Notifier from "./Notifier";
import { setRowFlag } from "../../redux/actions/annotationActions";
import { GRUDStore, LinkColumn, Row } from "../../types/grud";
import i18n from "i18next";
import apiUrl, { previewUrl } from "../../helpers/apiUrl";
import { canUserEditRowAnnotations } from "../../helpers/accessManagementHelper";
import PreviewTitle, { PreviewDefaultTitle } from "./PreviewTitle";
import actions from "../../redux/actionCreators";

type PreviewRowViewProps = {
  langtag: string;
  tableId: number;
  columnId: number | undefined;
  row: Row;
  columnsAndRow: ColumnAndRow[];
  defaultTitle: PreviewDefaultTitle | undefined;
};

export default function PreviewRowView({
  langtag,
  tableId,
  row,
  columnId,
  columnsAndRow,
  defaultTitle
}: PreviewRowViewProps): ReactElement {
  const dispatch = useDispatch();

  const reduxColumns = useSelector((store: GRUDStore) => store.columns);
  const reduxRows = useSelector((store: GRUDStore) => store.rows);

  const handleColumnSelection = async (columnId: number, rowId: number) => {
    const newColumnAndRow = columnsAndRow.find(c => c.column.id === columnId);
    const newUrl = previewUrl({ langtag, tableId, columnId, rowId });
    window.history.replaceState({}, "", newUrl);

    if (!newColumnAndRow) return;

    dispatch({
      type: actionTypes.preview.PREVIEW_SET_CURRENT_COLUMN,
      currentColumn: columnId
    });

    if (newColumnAndRow.column.kind === "link") {
      const linkedRowIds: number[] =
        newColumnAndRow.row.values.map((r: Row) => r.id) || [];
      const toTable = (newColumnAndRow.column as LinkColumn).toTable;

      dispatch({
        type: actionTypes.preview.PREVIEW_SET_CURRENT_DETAIL_TABLE,
        currentDetailTable: toTable
      });
      dispatch({
        type: actionTypes.preview.PREVIEW_SET_LINKED_SELECTION,
        selectedLinkedEntries: linkedRowIds
      });

      if (!reduxColumns[toTable]) {
        try {
          await actions.loadColumns(toTable)(dispatch);
        } catch (err) {
          console.error("Error loading columns:", err);
          return;
        }
      }

      if (!reduxRows[toTable]) {
        linkedRowIds.forEach(rowId => {
          dispatch(
            actions.fetchSingleRow({
              tableId: toTable,
              selectedRowId: rowId
            })
          );
        });
      }
    } else {
      dispatch({
        type: actionTypes.preview.PREVIEW_SET_CURRENT_DETAIL_TABLE,
        currentDetailTable: undefined
      });
    }
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

      <PreviewTitle
        langtag={langtag}
        tableId={tableId}
        columnsAndRow={columnsAndRow}
        defaultTitle={defaultTitle}
      />

      <table>
        <tbody>
          {columnsAndRow
            .filter(({ column }) => !isPreviewTitle(column))
            .map(({ column, row }) => {
              const cellLink = apiUrl({
                langtag,
                tableId,
                columnId: column.id,
                rowId: row.id
              });

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
