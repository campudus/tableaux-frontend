import { ReactElement } from "react";
import { Row } from "../../types/grud";

type RichtextDetailViewProps = {
  langtag: string;
  indexOfCurrentColumn: number;
  currentRow: Row;
};

export default function RichtextDetailView({
  langtag,
  indexOfCurrentColumn,
  currentRow
}: RichtextDetailViewProps): ReactElement {
  const cellValue = currentRow.values?.[indexOfCurrentColumn] as Record<
    string,
    string
  >;
  const text = cellValue[langtag] || "No content available";

  return (
    <div className="richtext-detail-view">
      <p>{text}</p>
    </div>
  );
}
