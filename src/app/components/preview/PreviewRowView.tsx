import { ReactElement } from "react";
import { Column, Row } from "../../types/grud";
import Spinner from "../header/Spinner";
import getDisplayValue from "../../helpers/getDisplayValue";

type PreviewRowViewProps = {
  langtag: string;
  tableId: number;
  columns: Column[] | undefined;
  row: Row | undefined;
};

export default function PreviewRowView({
  langtag,
  tableId,
  columns,
  row
}: PreviewRowViewProps): ReactElement {
  return (
    <div className="preview-row-view">
      {columns && row ? (
        <table>
          <tbody>
            {columns
              ?.filter(column => column.id !== 0)
              .map(column => {
                const columnLink = `/${langtag}/tables/${tableId}/columns/${column.id}`;
                const cellLink = `/${langtag}/tables/${tableId}/columns/${column.id}/rows/${row.id}`;
                let value = getDisplayValue(column)(row?.values.at(column.id));

                if (Array.isArray(value))
                  value = value.map(v => v[langtag]).join(", ");
                else {
                  value = value[langtag];
                }

                return (
                  <tr key={column.id}>
                    <td className="preview-row-view__column-name">
                      <a href={columnLink}>{column.displayName[langtag]}</a>
                    </td>
                    <td className="preview-row-view__column-value">
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
