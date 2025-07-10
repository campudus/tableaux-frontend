import { ReactElement } from "react";
import { useSelector } from "react-redux";
import { CellValue, GRUDStore, Row } from "../../types/grud";
import Spinner from "../header/Spinner";
import getDisplayValue from "../../helpers/getDisplayValue";
import { buildClassName } from "../../helpers/buildClassName";

type PreviewDetailViewProps = {
  langtag: string;
  currentTable: number;
  currentColumn: number;
  currentRow: Row;
  currentDetailTable: number;
};

export default function PreviewDetailView({
  langtag,
  currentTable,
  currentColumn,
  currentRow,
  currentDetailTable
}: PreviewDetailViewProps): ReactElement {
  const linkedRows = currentRow.values[currentColumn] as (CellValue & {
    id: number;
  })[];
  const linkedRowIds = linkedRows.map(row => row.id);

  const columns = useSelector(
    (store: GRUDStore) => store.columns[currentDetailTable]?.data
  );
  const filteredColumns = columns?.filter(column => column.id !== 0);

  const rows = useSelector(
    (store: GRUDStore) => store.rows[currentDetailTable]?.data
  );
  const filteredRows = rows?.filter(row => linkedRowIds.includes(row.id));

  const title = useSelector(
    (store: GRUDStore) =>
      store.columns[currentTable]?.data.find(
        column => column.id === currentColumn
      )?.displayName[langtag]
  );

  if (!filteredColumns || !rows || !title) {
    return <Spinner isLoading />;
  }

  return (
    <div className="preview-detail-view">
      <h2 className="preview-detail-view__title">{title}</h2>

      <div className="preview-detail-view__table-wrapper">
        <table>
          <tbody>
            {filteredColumns.map((column, index) => {
              const columnLink = `/${langtag}/tables/${currentDetailTable}/columns/${column.id}`;
              return (
                <tr
                  key={column.id}
                  className={buildClassName("preview-detail-view__row", {
                    uneven: index % 2 === 0
                  })}
                >
                  <td className="preview-detail-view__column preview-detail-view__column-name">
                    <a href={columnLink}>{column.displayName[langtag]}</a>
                  </td>
                  {filteredRows?.map(row => {
                    const cellLink = `/${langtag}/tables/${currentDetailTable}/columns/${column.id}/rows/${row.id}`;
                    const rowValue =
                      row.values.length > 1
                        ? row?.values.at(column.id)
                        : row?.values.at(0);
                    let value = getDisplayValue(column)(rowValue);

                    if (Array.isArray(value))
                      value = value.map(v => v[langtag]).join(", ");
                    else {
                      value = value[langtag];
                    }

                    return (
                      <td
                        key={row.id}
                        className="preview-detail-view__column preview-detail-view__column-value"
                      >
                        <a
                          className={value ? undefined : "empty"}
                          href={cellLink}
                        >
                          {value || "Leer"}
                        </a>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
