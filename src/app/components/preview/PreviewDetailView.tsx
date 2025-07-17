import { ReactElement, useState } from "react";
import { useSelector } from "react-redux";
import { CellValue, GRUDStore, Row } from "../../types/grud";
import RichtextDetailView from "./RichtextDetailView";
import LinkDetailView from "./LinkDetailView";

type PreviewDetailViewProps = {
  langtag: string;
  currentTable: number;
  currentColumnId: number;
  currentRow: Row;
};

export default function PreviewDetailView({
  langtag,
  currentTable,
  currentColumnId,
  currentRow
}: PreviewDetailViewProps): ReactElement {
  const title = useSelector(
    (store: GRUDStore) =>
      store.columns[currentTable]?.data.find(
        column => column.id === currentColumnId
      )?.displayName[langtag]
  );
  const currentDetailTable = useSelector(
    (store: GRUDStore) => store.preview.currentDetailTable
  );

  const [showDifferences, setShowDifferences] = useState(false);

  const currentColumn = currentRow.cells?.find(
    cell => cell.column.id === currentColumnId
  )?.column;

  const indexOfCurrentColumn = currentRow.cells?.findIndex(
    cell => cell.column.id === currentColumnId
  );

  if (!indexOfCurrentColumn) {
    return <div>Could not find index of the current column</div>;
  }

  const linkedCells = currentRow.values[indexOfCurrentColumn] as (CellValue & {
    id: number;
  })[];

  const fullTitle =
    linkedCells?.length && linkedCells.length > 1
      ? `${title} (${linkedCells.length})`
      : title;

  function renderDetailView(): ReactElement | null {
    if (!currentColumn) {
      return <div>No current column</div>;
    }

    if (!indexOfCurrentColumn) {
      return <div>Could not find index of the current column</div>;
    }

    if (currentColumn.kind === "richtext") {
      return (
        <RichtextDetailView
          langtag={langtag}
          indexOfCurrentColumn={indexOfCurrentColumn}
          currentRow={currentRow}
        />
      );
    }

    if (currentColumn.kind === "link") {
      if (!currentDetailTable) {
        return <div>No detail table selected.</div>;
      }

      return (
        <LinkDetailView
          langtag={langtag}
          indexOfCurrentColumn={indexOfCurrentColumn}
          currentDetailTable={currentDetailTable}
          currentRow={currentRow}
          showDifferences={showDifferences}
        />
      );
    }

    return null;
  }

  console.log({ currentColumn });

  return (
    <div className="preview-detail-view">
      <div className="preview-detail-view__header">
        <h2 className="preview-detail-view__title">{fullTitle}</h2>

        {currentColumn?.kind === "link" && (
          <div className="preview-detail-view__checkbox">
            <input
              type="checkbox"
              checked={showDifferences}
              onChange={() => setShowDifferences(!showDifferences)}
            />
            <label>Unterschiede anzeigen</label>
          </div>
        )}
      </div>

      {renderDetailView()}
    </div>
  );
}
