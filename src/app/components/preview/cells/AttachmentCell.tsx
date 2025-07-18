import { ReactElement } from "react";
import { Link } from "react-router-dom";
import { Attachment } from "../../../types/grud";
import { setEmptyClassName } from "../helper";

type AttachmentCellProps = {
  attachemnts: Attachment[] | undefined;
  link: string;
};

export default function AttachmentCell({
  attachemnts,
  link
}: AttachmentCellProps): ReactElement {
  return !attachemnts || attachemnts.length === 0 ? (
    <Link className={`attachemnt-cell ${setEmptyClassName()}`} to={link}>
      Leer
    </Link>
  ) : (
    <div className="attachemnt-cell">
      <span>Bilder anzeigen ({attachemnts.length})</span>
    </div>
  );
}
