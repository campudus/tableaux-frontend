import { ReactElement } from "react";
import { useSelector } from "react-redux";
import { CellValue, GRUDStore, Row } from "../../types/grud";
import Spinner from "../header/Spinner";
import getDisplayValue from "../../helpers/getDisplayValue";
import { buildClassName } from "../../helpers/buildClassName";
import { getColumnDisplayName } from "../../helpers/multiLanguage";
import LinkedEntrySelection from "./LinkedEntrySelection";
import { filterOutIdColumn } from "./helper";

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
  const indexOfCurrentColumn =
    currentRow.cells?.findIndex(cell => cell.column.id === currentColumn) ||
    currentColumn;

  const linkedCellsColumn = currentRow.cells?.[indexOfCurrentColumn]?.column;
  const linkedCells = currentRow.values[indexOfCurrentColumn] as (CellValue & {
    id: number;
  })[];
  const linkedCellIds = linkedCells.map(row => row.id);

  const columns = useSelector(
    (store: GRUDStore) => store.columns[currentDetailTable]?.data
  );
  const rows = useSelector(
    (store: GRUDStore) => store.rows[currentDetailTable]?.data
  );

  const selectedLinkedEntries = useSelector(
    (store: GRUDStore) => store.preview.selectedLinkedEntries
  );
  const linkedRows = rows?.filter(row => linkedCellIds.includes(row.id));
  const selectedLinkedRows =
    selectedLinkedEntries && selectedLinkedEntries.length > 0
      ? linkedRows?.filter(row => selectedLinkedEntries?.includes(row.id))
      : linkedRows;

  const { filteredColumns, filteredRows } = filterOutIdColumn(
    columns,
    selectedLinkedRows
  );

  const title = useSelector(
    (store: GRUDStore) =>
      store.columns[currentTable]?.data.find(
        column => column.id === currentColumn
      )?.displayName[langtag]
  );

  const fullTitle =
    linkedCells?.length && linkedCells.length > 1
      ? `${title} (${linkedCells.length})`
      : title;

  if (!filteredColumns || !filteredRows || !title) {
    return <Spinner isLoading />;
  }

  return (
    <div className="preview-detail-view">
      <h2 className="preview-detail-view__title">{fullTitle}</h2>

      {linkedCellsColumn && linkedCells.length > 0 && (
        <LinkedEntrySelection
          langtag={langtag}
          linkedEntries={linkedCells}
          linkedEntriesColumn={linkedCellsColumn}
        />
      )}

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
                    <a href={columnLink}>
                      {getColumnDisplayName(column, langtag)}
                    </a>
                  </td>
                  {filteredRows.map(row => {
                    const cellLink = `/${langtag}/tables/${currentDetailTable}/columns/${column.id}/rows/${row.id}`;
                    const rowValue =
                      row.values.length > 1
                        ? row?.values.at(index)
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
