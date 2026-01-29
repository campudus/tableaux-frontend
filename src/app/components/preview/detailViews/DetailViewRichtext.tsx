import { ReactElement } from "react";
import ReactMarkdown from "react-markdown";

type DetailViewRichtextProps = {
  title: string | undefined;
  richtext: string | undefined;
};

export default function DetailViewRichtext({
  title,
  richtext
}: DetailViewRichtextProps): ReactElement {
  const text = richtext || "No content available";

  return (
    <div className="detail-view-richtext">
      <h2 className="detail-view-richtext__title">{title}</h2>

      <div className="detail-view-richtext__content">
        <ReactMarkdown className="content-box">{text}</ReactMarkdown>
      </div>
    </div>
  );
}
