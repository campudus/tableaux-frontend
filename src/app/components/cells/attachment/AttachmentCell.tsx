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

type AttachmentCellProps = {
  cell: Cell;
  editing: boolean;
  selected: boolean;
  langtag: string;
};

export default function AttachmentCell({
  langtag,
  cell,
  editing,
  selected
}: AttachmentCellProps): ReactElement {
  const dispatch = useDispatch();
  const translate = retrieveTranslation(langtag);
  const attachments = (cell.value as unknown) as Attachment[];
  const isPreview = !selected && !editing;
  const folderIds = f.uniq(f.map(a => a.folder, attachments));
  const folderId = folderIds.length === 1 ? folderIds.at(0) : undefined;

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
              icon={
                <MediaThumbnail
                  langtag={langtag}
                  dirent={attachment}
                  layout="table"
                  width={150}
                />
              }
              alt={translate(attachment.title)}
              onClick={() => handleClickAttachment(attachment)}
            />
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
