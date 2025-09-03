import { ReactElement, useState } from "react";
import { Attachment } from "../../../types/grud";
import { setEmptyClassName } from "../helper";

type AttachmentCellProps = {
  langtag: string;
  attachemnts: Attachment[] | undefined;
  link: string;
};

export default function AttachmentCell({
  langtag,
  attachemnts,
  link
}: AttachmentCellProps): ReactElement {
  const [open, setOpen] = useState(false);

  if (!attachemnts || attachemnts.length === 0) {
    return (
      <a
        className={`attachemnt-cell preview-cell-value-link ${setEmptyClassName()}`}
        href={link}
      >
        Leer
      </a>
    );
  }

  return (
    <>
      <button
        className="attachemnt-cell attachemnt-cell__link"
        onClick={() => setOpen(true)}
        type="button"
      >
        <span>Bilder anzeigen ({attachemnts.length})</span>
      </button>

      {open && (
        <div className="attachment-slider-overlay">
          <div
            className="attachment-slider-backdrop"
            onClick={() => setOpen(false)}
          />

          <div className="attachment-slider-modal">
            {/* image slider goes here */}
            {attachemnts.map((att, idx) => (
              <img
                key={idx}
                src={"/api" + att.url[langtag]}
                alt={"alt"}
                style={{ maxWidth: "80vw", maxHeight: "80vh", margin: "8px" }}
              />
            ))}
            {/* <button onClick={() => setOpen(false)}>Schließen</button> */}
          </div>
        </div>
      )}
    </>
  );
}
