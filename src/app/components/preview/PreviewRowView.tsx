import { ReactElement, useState } from "react";
import { Column, Row } from "../../types/grud";
import Spinner from "../header/Spinner";
import getDisplayValue from "../../helpers/getDisplayValue";

type PreviewRowViewProps = {
  langtag: string;
  tableId: number;
  rowId: number;
  columnId: number | undefined;
  columns: Column[] | undefined;
  row: Row | undefined;
};

export default function PreviewRowView({
  langtag,
  tableId,
  rowId,
  columnId,
  columns,
  row
}: PreviewRowViewProps): ReactElement {
  const [selectedColumn, setSelectedColumn] = useState<number | null>(
    columnId || null
  );

  const handleColumnSelection = (columnId: number) => {
    setSelectedColumn(columnId);

    const newUrl = `/${langtag}/preview/${tableId}/columns/${columnId}/rows/${rowId}`;
    window.history.replaceState({}, "", newUrl);
  };

  return (
    <div className="preview-row-view">
      {columns && row ? (
        <table>
          <tbody>
            {columns
              ?.filter(column => column.id !== 0)
              .map(column => {
                const columnLink = `/${langtag}/tables/${tableId}/columns/${column.id}`;
                const cellLink = `/${langtag}/tables/${tableId}/columns/${column.id}/rows/${rowId}`;
                let value = getDisplayValue(column)(row?.values.at(column.id));

                if (Array.isArray(value))
                  value = value.map(v => v[langtag]).join(", ");
                else {
                  value = value[langtag];
                }

                return (
                  <tr key={column.id} className="preview-row-view__row">
                    <td className="preview-row-view__column preview-row-view__column-selection">
                      <input
                        type="radio"
                        name="column-selection"
                        checked={selectedColumn === column.id}
                        onChange={() => handleColumnSelection(column.id)}
                      />
                    </td>
                    <td className="preview-row-view__column preview-row-view__column-name">
                      <a href={columnLink}>{column.displayName[langtag]}</a>
                    </td>
                    <td className="preview-row-view__column preview-row-view__column-value">
                      <a
                        className={value ? undefined : "empty"}
                        href={cellLink}
                      >
                        {value || "Leer"}
                      </a>
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      ) : (
        <Spinner isLoading />
      )}
    </div>
  );
}
