import { ReactElement } from "react";
import { Row } from "../../types/grud";
import ReactMarkdown from "react-markdown";

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
    <div className="richtext-detail-view" style={{ padding: "16px 16px 0 0" }}>
      <ReactMarkdown className="content-box">{text}</ReactMarkdown>
    </div>
  );
}
