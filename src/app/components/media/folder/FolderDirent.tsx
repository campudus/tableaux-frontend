import f from "lodash/fp";
import { CSSProperties, ReactElement } from "react";
import { isAttachment } from "../../../types/guards";
import { Attachment, Folder } from "../../../types/grud";
import { buildClassName as cn } from "../../../helpers/buildClassName";
import { useDispatch } from "react-redux";
import { retrieveTranslation } from "../../../helpers/multiLanguage";
import apiUrl from "../../../helpers/apiUrl";
import { useHistory } from "react-router-dom";
import { switchFolderHandler } from "../../Router";
import FolderDirentThumbnail from "./FolderDirentThumbnail";
import { Layout } from "./FolderToolbar";
import FolderAction from "./FolderAction";

type FolderDirentProps = {
  className?: string;
  style: CSSProperties;
  langtag: string;
  dirent: Attachment | Folder;
  layout: Layout;
  fileIdsDiff: string[];
};

export default function FolderDirent({
  className,
  style,
  langtag,
  dirent,
  layout,
  fileIdsDiff
}: FolderDirentProps): ReactElement {
  const dispatch = useDispatch();
  const history = useHistory();

  const isFile = isAttachment(dirent);
  const isModified = isFile && f.contains(dirent.uuid, fileIdsDiff);
  const translate = retrieveTranslation(langtag);
  const label = isFile ? translate(dirent.title) : dirent.name;

  const handleClick = () => {
    if (isFile) {
      window.open(apiUrl(translate(dirent.url)), "_blank");
    } else {
      switchFolderHandler(history, langtag, dirent?.id);
    }
  };

  return (
    <div
      style={style}
      className={cn(
        "folder-dirent",
        { modified: isModified, [layout]: true },
        className
      )}
    >
      <FolderAction
        className="folder-dirent__action"
        icon={
          <FolderDirentThumbnail
            className="folder-dirent__thumbnail"
            langtag={langtag}
            dirent={dirent}
            layout={layout}
          />
        }
        label={
          <span className="folder-dirent__label" title={label}>
            {label}
          </span>
        }
        onClick={handleClick}
      />
    </div>
  );
}
