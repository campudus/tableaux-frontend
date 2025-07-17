import { ReactElement } from "react";
import { Row, Column, CellValue, GRUDStore } from "../../types/grud";
import { useSelector } from "react-redux";
import { filterOutIdColumn } from "./helper";
import getDisplayValue from "../../helpers/getDisplayValue";
import LinkedEntrySelection from "./LinkedEntrySelection";
import { buildClassName } from "../../helpers/buildClassName";
import { getColumnDisplayName } from "../../helpers/multiLanguage";
import CellValueLink from "./CellValueLink";

type ColumnWithIndex = { column: Column; columnIndex: number };

type LinkDetailViewProps = {
  langtag: string;
  indexOfCurrentColumn: number;
  currentDetailTable: number;
  currentRow: Row;
  showDifferences: boolean;
};

export default function LinkDetailView({
  langtag,
  indexOfCurrentColumn,
  currentDetailTable,
  currentRow,
  showDifferences
}: LinkDetailViewProps): ReactElement {
  const columns = useSelector(
    (store: GRUDStore) => store.columns[currentDetailTable]?.data
  );
  const rows = useSelector(
    (store: GRUDStore) => store.rows[currentDetailTable]?.data
  );
  const selectedLinkedEntries = useSelector(
    (store: GRUDStore) => store.preview.selectedLinkedEntries
  );

  const linkedCellsColumn = currentRow.cells?.[indexOfCurrentColumn]?.column;
  const linkedCells = currentRow.values[indexOfCurrentColumn] as (CellValue & {
    id: number;
  })[];
  const linkedCellIds = linkedCells.map(row => row.id);

  const linkedRows = rows?.filter(row => linkedCellIds.includes(row.id));
  const selectedLinkedRows =
    selectedLinkedEntries && selectedLinkedEntries.length > 0
      ? linkedRows?.filter(row => selectedLinkedEntries?.includes(row.id))
      : linkedRows;

  const { filteredColumns, filteredRows } = filterOutIdColumn(
    columns,
    selectedLinkedRows
  );

  function getColumnsWithDifferences(
    columns: Column[],
    rows: Row[] | undefined,
    langtag: string
  ): ColumnWithIndex[] {
    if (!rows || rows.length < 2)
      return columns.map((column, index) => ({
        column,
        columnIndex: index
      }));

    return columns
      .map((column, columnIndex) => {
        const firstValue = getDisplayValue(column)(
          rows[0]?.values && rows[0].values.length > 1
            ? rows[0].values.at(columnIndex)
            : rows[0]?.values?.at(0)
        );
        const firstDisplay = Array.isArray(firstValue)
          ? firstValue.map(v => v[langtag]).join(", ")
          : firstValue[langtag];

        const hasDifference = rows.some(row => {
          const value = getDisplayValue(column)(
            row.values.length > 1
              ? row.values.at(columnIndex)
              : row.values.at(0)
          );
          const display = Array.isArray(value)
            ? value.map(v => v[langtag]).join(", ")
            : value[langtag];

          return display !== firstDisplay;
        });

        return hasDifference ? { column, columnIndex } : null;
      })
      .filter(Boolean) as ColumnWithIndex[];
  }

  const columnsToDisplay = showDifferences
    ? getColumnsWithDifferences(filteredColumns, filteredRows, langtag)
    : filteredColumns.map((column, idx) => ({
        column,
        columnIndex: idx
      }));

  return (
    <div className="link-detail-view">
      {linkedCellsColumn && linkedCells.length > 1 && (
        <LinkedEntrySelection
          langtag={langtag}
          linkedEntries={linkedCells}
          linkedEntriesColumn={linkedCellsColumn}
        />
      )}

      <div className="preview-detail-view__table-wrapper">
        <table>
          <tbody>
            {columnsToDisplay.map(({ column, columnIndex }, index) => {
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

                  {filteredRows?.map((row, rowIndex) => (
                    <td
                      className="preview-detail-view__column preview-detail-view__column-value"
                      key={rowIndex}
                    >
                      <CellValueLink
                        langtag={langtag}
                        column={column}
                        columnIndex={columnIndex}
                        row={row}
                        link={`/${langtag}/tables/${currentDetailTable}/columns/${column.id}/rows/${row.id}`}
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
