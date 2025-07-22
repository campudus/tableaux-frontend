import { ReactElement, useState } from "react";
import { useSelector } from "react-redux";
import { CellValue, GRUDStore } from "../../types/grud";
import RichtextDetailView from "./RichtextDetailView";
import LinkDetailView from "./LinkDetailView";
import { ColumnAndRow } from "./helper";

type PreviewDetailViewProps = {
  langtag: string;
  currentTable: number;
  currentColumnId: number;
  selectedColumnAndRow: ColumnAndRow | undefined;
};

export default function PreviewDetailView({
  langtag,
  currentTable,
  currentColumnId,
  selectedColumnAndRow
}: PreviewDetailViewProps): ReactElement {
  const [showDifferences, setShowDifferences] = useState(false);

  const title = useSelector(
    (store: GRUDStore) =>
      store.columns[currentTable]?.data.find(
        column => column.id === currentColumnId
      )?.displayName[langtag]
  );
  const currentDetailTable = useSelector(
    (store: GRUDStore) => store.preview.currentDetailTable
  );

  const currentColumn = selectedColumnAndRow?.column;
  const linkedCells = selectedColumnAndRow?.row.values as (CellValue & {
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

    if (currentColumn.kind === "richtext") {
      return (
        <RichtextDetailView
          richtext={selectedColumnAndRow.row.values[langtag] as string}
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
          currentDetailTable={currentDetailTable}
          selectedColumnAndRow={selectedColumnAndRow}
          linkedCells={linkedCells}
          showDifferences={showDifferences}
        />
      );
    }

    return null;
  }

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
