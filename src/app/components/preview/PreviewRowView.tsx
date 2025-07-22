import { ReactElement } from "react";
import actionTypes from "../../redux/actionTypes";
import { useDispatch } from "react-redux";
import { getColumnDisplayName } from "../../helpers/multiLanguage";
import CellValueLink from "./CellValueLink";
import { buildClassName } from "../../helpers/buildClassName";
import { ColumnAndRow } from "./helper";

type PreviewRowViewProps = {
  langtag: string;
  tableId: number;
  currentColumn: number | undefined;
  columnsAndRow: ColumnAndRow[];
};

export default function PreviewRowView({
  langtag,
  tableId,
  currentColumn,
  columnsAndRow
}: PreviewRowViewProps): ReactElement {
  const dispatch = useDispatch();

  const handleColumnSelection = (columnId: number, rowId: number) => {
    const newUrl = `/${langtag}/preview/${tableId}/columns/${columnId}/rows/${rowId}`;
    window.history.replaceState({}, "", newUrl);

    dispatch({
      type: actionTypes.preview.PREVIEW_SET_CURRENT_COLUMN,
      currentColumn: columnId
    });
  };

  return (
    <div className="preview-row-view">
      <table>
        <tbody>
          {columnsAndRow.map(({ column, row }) => {
            const columnLink = `/${langtag}/tables/${tableId}/columns/${column.id}`;
            const cellLink = `/${langtag}/tables/${tableId}/columns/${column.id}/rows/${row.id}`;

            return (
              <tr
                key={column.id}
                className={buildClassName("preview-row-view__row", {
                  selected: currentColumn === column.id
                })}
              >
                <td className="preview-row-view__column preview-row-view__column-selection">
                  {(column.kind === "link" || column.kind === "richtext") && (
                    <input
                      type="radio"
                      name="column-selection"
                      checked={currentColumn === column.id}
                      onChange={() => handleColumnSelection(column.id, row.id)}
                    />
                  )}
                </td>

                <td className="preview-row-view__column preview-row-view__column-name">
                  <a href={columnLink}>
                    {getColumnDisplayName(column, langtag)}
                  </a>
                </td>

                <td className="preview-row-view__column preview-row-view__column-value">
                  <CellValueLink
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
