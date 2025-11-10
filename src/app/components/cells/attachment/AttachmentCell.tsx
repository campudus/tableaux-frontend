import f from "lodash/fp";
import cns from "classnames";
import { ReactElement, useEffect, useRef, useState } from "react";
import apiUrl from "../../../helpers/apiUrl";
import { isLocked } from "../../../helpers/rowUnlock";
import { canUserChangeCell } from "../../../helpers/accessManagementHelper";
import { retrieveTranslation } from "../../../helpers/multiLanguage";
import { Attachment, Cell } from "../../../types/grud";
import ButtonAction from "../../helperComponents/ButtonAction";
import MediaThumbnail from "../../media/MediaThumbnail";
import { openAttachmentOverlay } from "./AttachmentOverlay";
import LabelTruncated from "../../helperComponents/LabelTruncated";
import Tooltip from "../../helperComponents/Tooltip/TooltipWithState";

type AttachmentCellProps = {
  cell: Cell;
  editing: boolean;
  selected: boolean;
  langtag: string;
  width: number;
};

export default function AttachmentCell({
  langtag,
  cell,
  editing,
  selected,
  width
}: AttachmentCellProps): ReactElement {
  const contentRef = useRef<HTMLDivElement>(null);
  const [ellipsisIndex, setEllipsisIndex] = useState(-1);
  const translate = retrieveTranslation(langtag);
  const attachments = (cell.value as unknown) as Attachment[];
  const isPreview = !selected && !editing;
  const folderIds = f.uniq(f.map(a => a.folder, attachments));
  const folderId = folderIds.length === 1 ? folderIds.at(0) : undefined;

  const handleClickAttachment = (attachment: Attachment) => {
    window.open(apiUrl(translate(attachment.url)), "_blank");
  };

  const handleClickEdit = () => {
    openAttachmentOverlay({ langtag, cell, folderId });
  };

  useEffect(() => {
    contentRef.current?.scrollTo(0, 0);
  }, [selected]);

  return (
    <>
      <div
        ref={contentRef}
        className={cns("cell-content", { editing, selected })}
      >
        {attachments.map((attachment, attachmentIndex) => {
          const title = translate(attachment.title);
          const isLastAttachment = attachments.length - 1 === attachmentIndex;

          return (
            <>
              <ButtonAction
                key={attachment.uuid}
                className={"attachment__action"}
                onClick={() => handleClickAttachment(attachment)}
                icon={
                  <Tooltip tooltip={title} offsetTop={5}>
                    <MediaThumbnail
                      langtag={langtag}
                      dirent={attachment}
                      layout="table"
                      width={150}
                      loadStrategy={"eager"} // load thumbnail eagerly, because we have virtualization in table
                      onVisibilityChange={isVisible => {
                        const previousAttachmentIndex = attachmentIndex - 1;

                        if (
                          !isVisible &&
                          ellipsisIndex > previousAttachmentIndex
                        ) {
                          setEllipsisIndex(previousAttachmentIndex);
                        } else if (
                          isVisible &&
                          ellipsisIndex < attachmentIndex
                        ) {
                          setEllipsisIndex(attachmentIndex);
                        }
                      }}
                      fallbackLabel={
                        <LabelTruncated
                          width={Math.min(220, width - 50)}
                          label={title}
                        />
                      }
                    />
                  </Tooltip>
                }
              />
              {!isLastAttachment &&
                isPreview &&
                attachmentIndex === ellipsisIndex &&
                "..."}
            </>
          );
        })}
      </div>

      {!isPreview && !isLocked(cell.row) && canUserChangeCell(cell)(langtag) && (
        <button className="edit" onClick={handleClickEdit}>
          <span className="fa fa-pencil" />
        </button>
      )}
    </>
  );
}
