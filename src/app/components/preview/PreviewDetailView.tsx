import { ReactElement } from "react";
import { useSelector } from "react-redux";
import { GRUDStore, Row } from "../../types/grud";
import DetailViewRichtext from "./detailViews/DetailViewRichtext";
import DetailViewLink from "./detailViews/DetailViewLink";
import { ColumnAndRow } from "./helper";
import i18n from "i18next";

type PreviewDetailViewProps = {
  langtag: string;
  currentTable: number;
  currentColumnId: number;
  currentDetailTable: number | null;
  selectedColumnAndRow: ColumnAndRow | undefined;
};

const getNoColumnContent = () => {
  return (
    <div className="preview-view__centered">
      {i18n.t("preview:warning_no_column_selected")}
    </div>
  );
};
const getNoDetailTableContent = () => {
  return (
    <div className="preview-view__centered">
      {i18n.t("preview:warning_no_detail_table_selected")}
    </div>
  );
};
const getNoLinkedEntriesContent = () => {
  return (
    <div className="preview-view__centered">
      {i18n.t("preview:warning_no_linked_entries")}
    </div>
  );
};

const cssClass = "preview-detail-view";

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

  if (!currentColumn)
    return <div className={cssClass}>{getNoColumnContent()}</div>;

  if (currentColumn.kind === "richtext") {
    return (
      <div className={cssClass}>
        <DetailViewRichtext
          title={title}
          richtext={selectedColumnAndRow.row.values[langtag] as string}
        />
      </div>
    );
  }

  if (currentColumn.kind === "link") {
    if (!currentDetailTable)
      return <div className={cssClass}>{getNoDetailTableContent()}</div>;
    if (!sortedLinkedCells)
      return <div className={cssClass}>{getNoLinkedEntriesContent()}</div>;

    return (
      <div className={cssClass}>
        <DetailViewLink
          langtag={langtag}
          title={title}
          currentDetailTable={currentDetailTable}
          selectedColumnAndRow={selectedColumnAndRow}
          linkedCells={sortedLinkedCells}
        />
      </div>
    );
  }

  return (
    <div className="preview-view__centered">
      {i18n.t("preview:error_no_preview_available")}
    </div>
  );
}
