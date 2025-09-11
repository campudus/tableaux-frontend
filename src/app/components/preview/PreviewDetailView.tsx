import { ReactElement } from "react";
import { useSelector } from "react-redux";
import { GRUDStore, Row } from "../../types/grud";
import DetailViewRichtext from "./detailViews/DetailViewRichtext";
import DetailViewLink from "./detailViews/DetailViewLink";
import { ColumnAndRow } from "./helper";

type PreviewDetailViewProps = {
  langtag: string;
  currentTable: number;
  currentColumnId: number;
  currentDetailTable: number | null;
  selectedColumnAndRow: ColumnAndRow | undefined;
};

export default function PreviewDetailView({
  langtag,
  currentTable,
  currentColumnId,
  currentDetailTable,
  selectedColumnAndRow
}: PreviewDetailViewProps): ReactElement {
  const title = useSelector(
    (store: GRUDStore) =>
      store.columns[currentTable]?.data.find(
        column => column.id === currentColumnId
      )?.displayName[langtag]
  );

  const currentColumn = selectedColumnAndRow?.column;

  const linkedCells = Array.isArray(selectedColumnAndRow?.row.values)
    ? (selectedColumnAndRow.row.values as Row[])
    : undefined;

  const sortedLinkedCells = linkedCells?.length
    ? [...linkedCells].sort((a, b) => a.id - b.id)
    : undefined;

  function renderDetailView(): ReactElement | null {
    if (!currentColumn) {
      return <div className="preview-view__centered">No column selected.</div>;
    }

    if (currentColumn.kind === "richtext") {
      return (
        <DetailViewRichtext
          title={title}
          richtext={selectedColumnAndRow.row.values[langtag] as string}
        />
      );
    }

    if (currentColumn.kind === "link") {
      if (!currentDetailTable) {
        return (
          <div className="preview-view__centered">
            No detail table selected.
          </div>
        );
      }

      if (!sortedLinkedCells) {
        return (
          <div className="preview-view__centered">
            No linked entries available.
          </div>
        );
      }

      return (
        <DetailViewLink
          langtag={langtag}
          title={title}
          currentDetailTable={currentDetailTable}
          selectedColumnAndRow={selectedColumnAndRow}
          linkedCells={sortedLinkedCells}
        />
      );
    }

    return null;
  }

  return <div className="preview-detail-view">{renderDetailView()}</div>;
}
