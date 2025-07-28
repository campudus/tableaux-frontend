import { ReactElement, useEffect } from "react";
import { CellValue, GRUDStore } from "../../../types/grud";
import { useDispatch, useSelector } from "react-redux";
import { ColumnAndRow, ColumnAndRows, combinedColumnsAndRows } from "../helper";
import LinkedEntrySelection from "../LinkedEntrySelection";
import { buildClassName } from "../../../helpers/buildClassName";
import { getColumnDisplayName } from "../../../helpers/multiLanguage";
import PreviewCellValue from "../PreviewCellValue";
import getDisplayValue from "../../../helpers/getDisplayValue";
import actionTypes from "../../../redux/actionTypes";

type LinkDetailViewProps = {
  langtag: string;
  currentDetailTable: number;
  selectedColumnAndRow: ColumnAndRow;
  linkedCells: (CellValue & { id: number })[];
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

  if (!columnsAndRows || columnsAndRows.length === 0) {
    return <div>No linked entries found</div>;
  }

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
    ? getColumnsWithDifferences(columnsAndRows, langtag)
    : columnsAndRows;

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

              const columnNameLink = selectedLinkedEntries
                ? columnLink + rowFilter
                : columnLink;

              return (
                <tr
                  key={column.id}
                  className={buildClassName("preview-detail-view__row", {
                    uneven: index % 2 === 0
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
