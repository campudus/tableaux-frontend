import { ReactElement } from "react";
import { Column, Row } from "../../types/grud";
import getDisplayValue from "../../helpers/getDisplayValue";
import actionTypes from "../../redux/actionTypes";
import { useDispatch } from "react-redux";
import { getColumnDisplayName } from "../../helpers/multiLanguage";

type PreviewRowViewProps = {
  langtag: string;
  tableId: number;
  currentColumn: number | undefined;
  columns: Column[];
  row: Row;
};

export default function PreviewRowView({
  langtag,
  tableId,
  currentColumn,
  columns,
  row
}: PreviewRowViewProps): ReactElement {
  const dispatch = useDispatch();

  const handleColumnSelection = (columnId: number) => {
    const newUrl = `/${langtag}/preview/${tableId}/columns/${columnId}/rows/${row.id}`;
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
          {columns.map((column, index) => {
            const columnLink = `/${langtag}/tables/${tableId}/columns/${column.id}`;
            const cellLink = `/${langtag}/tables/${tableId}/columns/${column.id}/rows/${row.id}`;
            const rowValue =
              row.values.length > 1 ? row?.values.at(index) : row?.values.at(0);
            let value = getDisplayValue(column)(rowValue);

            if (Array.isArray(value))
              value = value.map(v => v[langtag]).join(", ");
            else {
              value = value[langtag];
            }

            return (
              <tr key={column.id} className="preview-row-view__row">
                <td className="preview-row-view__column preview-row-view__column-selection">
                  {column.kind === "link" && (
                    <input
                      type="radio"
                      name="column-selection"
                      checked={currentColumn === column.id}
                      onChange={() => handleColumnSelection(column.id)}
                    />
                  )}
                </td>
                <td className="preview-row-view__column preview-row-view__column-name">
                  <a href={columnLink}>
                    {getColumnDisplayName(column, langtag)}
                  </a>
                </td>
                <td className="preview-row-view__column preview-row-view__column-value">
                  <a className={value ? undefined : "empty"} href={cellLink}>
                    {value || "Leer"}
                  </a>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
