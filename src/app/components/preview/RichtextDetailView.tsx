import { ReactElement } from "react";
import ReactMarkdown from "react-markdown";

type RichtextDetailViewProps = {
  richtext: string | undefined;
};

export default function RichtextDetailView({
  richtext
}: RichtextDetailViewProps): ReactElement {
  const text = richtext || "No content available";

  return (
    <div className="richtext-detail-view" style={{ padding: "16px 16px 0 0" }}>
      <ReactMarkdown className="content-box">{text}</ReactMarkdown>
    </div>
  );
}
