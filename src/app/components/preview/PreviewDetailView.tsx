import { ReactElement, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { CellValue, GRUDStore } from "../../types/grud";
import RichtextDetailView from "./detail-views/RichtextDetailView";
import LinkDetailView from "./detail-views/LinkDetailView";
import { ColumnAndRow } from "./helper";
import actionTypes from "../../redux/actionTypes";

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
  const dispatch = useDispatch();
  const [selectAll, setSelectAll] = useState(true);
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
  const sortedLinkedCells = linkedCells.sort((a, b) => a.id - b.id);
  const hasMultipleLinkedCells = sortedLinkedCells?.length > 1;

  const fullTitle = hasMultipleLinkedCells
    ? `${title} (${sortedLinkedCells.length})`
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
          linkedCells={sortedLinkedCells}
          showDifferences={showDifferences}
        />
      );
    }

    return null;
  }

  function handleSelectAll(selectAll: boolean): void {
    if (selectAll) {
      dispatch({
        type: actionTypes.preview.PREVIEW_SET_LINKED_SELECTION,
        selectedLinkedEntries: sortedLinkedCells.map(entry => entry.id)
      });
    } else {
      dispatch({
        type: actionTypes.preview.PREVIEW_SET_LINKED_SELECTION,
        selectedLinkedEntries: []
      });
    }

    setSelectAll(selectAll);
  }

  return (
    <div className="preview-detail-view">
      <div className="preview-detail-view__header">
        <h2 className="preview-detail-view__title">{fullTitle}</h2>

        {hasMultipleLinkedCells && (
          <div className="preview-detail-view__actions">
            <div className="preview-detail-view__checkbox">
              <input
                type="checkbox"
                checked={selectAll}
                onChange={() => handleSelectAll(!selectAll)}
              />
              <label>Alle auswählen</label>
            </div>

            <div className="preview-detail-view__checkbox">
              <input
                type="checkbox"
                checked={showDifferences}
                onChange={() => setShowDifferences(!showDifferences)}
              />
              <label>Unterschiede anzeigen</label>
            </div>
          </div>
        )}
      </div>

      {renderDetailView()}
    </div>
  );
}
