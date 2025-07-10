import f from "lodash/fp";
import cns from "classnames";
import { ReactElement } from "react";
import { useDispatch } from "react-redux";
import AttachmentOverlay from "./AttachmentOverlay";
import Header from "../../overlay/Header";
import actions from "../../../redux/actionCreators";
import apiUrl from "../../../helpers/apiUrl";
import { isLocked } from "../../../helpers/rowUnlock";
import { canUserChangeCell } from "../../../helpers/accessManagementHelper";
import { retrieveTranslation } from "../../../helpers/multiLanguage";
import { Attachment, Cell } from "../../../types/grud";
import ButtonAction from "../../helperComponents/ButtonAction";
import MediaThumbnail from "../../media/MediaThumbnail";

const PADDING = 18;
const GAP = 8;
const MORE_W = 10 + GAP;
const IMG_W = 40 + GAP;

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
  const dispatch = useDispatch();
  const translate = retrieveTranslation(langtag);
  const allAttachments = (cell.value as unknown) as Attachment[];
  const previewAttachmentCount = Math.floor((width - PADDING - MORE_W) / IMG_W);
  const previewAttachments = f.take(previewAttachmentCount, allAttachments);
  const isPreview = !selected && !editing;
  const hasMore = allAttachments.length > previewAttachments.length;
  const folderIds = f.uniq(f.map(a => a.folder, allAttachments));
  const folderId = folderIds.length === 1 ? folderIds.at(0) : undefined;
  const attachments = isPreview ? previewAttachments : allAttachments;

  const handleClickAttachment = (attachment: Attachment) => {
    window.open(apiUrl(translate(attachment.url)), "_blank");
  };

  const handleClickEdit = () => {
    dispatch(
      actions.openOverlay({
        head: <Header langtag={langtag} />,
        body: (
          <AttachmentOverlay
            cell={cell}
            langtag={langtag}
            folderId={folderId}
            value={cell.value}
          />
        ),
        type: "full-height",
        preferRight: true,
        title: cell
      })
    );
  };

  return (
    <>
      <div className={cns("cell-content", { editing, selected })}>
        {attachments.map(attachment => {
          return (
            <ButtonAction
              key={attachment.uuid}
              className={"attachment__action"}
              icon={<MediaThumbnail langtag={langtag} dirent={attachment} />}
              alt={translate(attachment.title)}
              onClick={() => handleClickAttachment(attachment)}
            />
          );
        })}
        {isPreview && hasMore && <span className="more">&hellip;</span>}
      </div>
      {!isPreview && !isLocked(cell.row) && canUserChangeCell(cell)(langtag) && (
        <button className="edit" onClick={handleClickEdit}>
          <span className="fa fa-pencil" />
        </button>
      )}
    </>
  );
}
