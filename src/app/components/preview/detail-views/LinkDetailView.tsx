import { ReactElement, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import f from "lodash/fp";
import { GRUDStore, Row } from "../../../types/grud";
import { ColumnAndRow, ColumnAndRows, combinedColumnsAndRows } from "../helper";
import LinkedEntrySelection from "../LinkedEntrySelection";
import { buildClassName } from "../../../helpers/buildClassName";
import { getColumnDisplayName } from "../../../helpers/multiLanguage";
import PreviewCellValue from "../PreviewCellValue";
import getDisplayValue from "../../../helpers/getDisplayValue";
import actionTypes from "../../../redux/actionTypes";
import { isStickyColumn, sortColumnsAndRows } from "../constants";

type LinkDetailViewProps = {
  langtag: string;
  currentDetailTable: number;
  selectedColumnAndRow: ColumnAndRow;
  linkedCells: Row[];
  showDifferences: boolean;
};

export default function LinkDetailView({
  langtag,
  currentDetailTable,
  selectedColumnAndRow,
  linkedCells,
  showDifferences
}: LinkDetailViewProps): ReactElement {
  const dispatch = useDispatch();
  const columns = useSelector(
    (store: GRUDStore) => store.columns[currentDetailTable]?.data
  );
  const rows = useSelector(
    (store: GRUDStore) => store.rows[currentDetailTable]?.data
  );
  const selectedLinkedEntries = useSelector(
    (store: GRUDStore) => store.preview.selectedLinkedEntries
  );

  useEffect(() => {
    dispatch({
      type: actionTypes.preview.PREVIEW_SET_LINKED_SELECTION,
      selectedLinkedEntries: linkedCells.map(entry => entry.id)
    });
  }, [linkedCells]);

  const linkedRows = rows?.filter(row =>
    linkedCells.map(cell => cell.id).includes(row.id)
  );

  const selectedLinkedRows =
    selectedLinkedEntries && selectedLinkedEntries.length > 0
      ? linkedRows?.filter(row => selectedLinkedEntries?.includes(row.id))
      : [];

  const columnsAndRows = combinedColumnsAndRows(columns, selectedLinkedRows);
  const columnsAndRowsSorted = sortColumnsAndRows(columnsAndRows);

  function getColumnsWithDifferences(
    columnsAndRows: ColumnAndRows[],
    langtag: string
  ): ColumnAndRows[] {
    return columnsAndRows.filter(({ column, rows }) => {
      const firstValue = getDisplayValue(column)(rows[0]?.values);
      const firstDisplay = Array.isArray(firstValue)
        ? firstValue.map(v => v[langtag]).join(", ")
        : firstValue[langtag];

      const hasDifference = rows.some(row => {
        const value = getDisplayValue(column)(row.values);
        const display = Array.isArray(value)
          ? value.map(v => v[langtag]).join(", ")
          : value[langtag];

        return display !== firstDisplay;
      });

      return hasDifference;
    });
  }

  const columnsToDisplay = showDifferences
    ? getColumnsWithDifferences(columnsAndRowsSorted, langtag)
    : columnsAndRowsSorted;

  // with this code we dynamically set the top offset for sticky rows
  // to ensure they are positioned correctly in the viewport
  // this is necessary because the height of the rows is dynamic
  useEffect(() => {
    const tableRows = document.querySelectorAll(
      ".preview-detail-view__row--sticky"
    );
    let offset = 0;

    if (!tableRows || tableRows.length === 0) return;

    tableRows.forEach(row => {
      (row as HTMLElement).style.top = `${offset}px`;
      offset += (row as HTMLElement).offsetHeight;
    });
  }, [columnsToDisplay]);

  if (!columnsToDisplay || columnsToDisplay.length === 0) {
    return <div>No linked entries found</div>;
  }

  return (
    <div className="link-detail-view">
      {linkedCells && linkedCells.length > 1 && (
        <LinkedEntrySelection
          langtag={langtag}
          linkedEntries={linkedCells}
          linkedEntriesColumn={selectedColumnAndRow.column}
        />
      )}

      <div className="preview-detail-view__table-wrapper">
        <table>
          <tbody>
            {columnsToDisplay.map(({ column, rows }, index) => {
              const columnLink = `/${langtag}/tables/${currentDetailTable}/columns/${column.id}`;
              const rowFilter = `/rows/${selectedLinkedEntries?.at(
                0
              )}?filter:id:${selectedLinkedEntries?.join(":")}`;

              const columnNameLink = !f.isEmpty(selectedLinkedEntries)
                ? columnLink + rowFilter
                : columnLink;

              return (
                <tr
                  key={column.id}
                  className={buildClassName("preview-detail-view__row", {
                    uneven: index % 2 === 0,
                    sticky: isStickyColumn(column)
                  })}
                >
                  <td className="preview-detail-view__column preview-detail-view__column-name">
                    <a href={columnNameLink}>
                      {getColumnDisplayName(column, langtag)}
                    </a>
                  </td>

                  {rows.map(row => (
                    <td
                      className="preview-detail-view__column preview-detail-view__column-value"
                      key={row.id}
                    >
                      <PreviewCellValue
                        langtag={langtag}
                        column={column}
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
