import { ReactElement } from "react";
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
    <a className={`attachemnt-cell ${setEmptyClassName()}`} href={link}>
      Leer
    </a>
  ) : (
    <div className="attachemnt-cell">
      <span>Bilder anzeigen ({attachemnts.length})</span>
    </div>
  );
}
