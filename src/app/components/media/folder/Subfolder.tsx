import i18n from "i18next";
import { useDispatch } from "react-redux";
import { useHistory } from "react-router-dom";
import { MouseEvent, ReactElement, useState } from "react";
import { Folder } from "../../../types/grud";
import {
  canUserDeleteFolders,
  canUserEditFolders
} from "../../../helpers/accessManagementHelper";
import { confirmDeleteFolder } from "../../overlay/ConfirmationOverlay";
import {
  deleteMediaFolder,
  editMediaFolder
} from "../../../redux/actions/mediaActions";
import { switchFolderHandler } from "../../Router";
import SubfolderEdit from "./SubfolderEdit";
import SvgIcon from "../../helperComponents/SvgIcon";
import actions from "../../../redux/actionCreators";
import {
  DirentMoveBody,
  DirentMoveFooter,
  DirentMoveHeader
} from "../overlay/DirentMove";

type SubfolderProps = {
  langtag: string;
  folder: Folder;
  onClick?: () => void;
};

export default function Subfolder({
  langtag,
  folder,
  onClick
}: SubfolderProps): ReactElement {
  const history = useHistory();
  const dispatch = useDispatch();
  const [isEdit, setIsEdit] = useState(false);

  const handleToggle = () => {
    setIsEdit(edit => !edit);
  };

  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    switchFolderHandler(history, langtag, folder.id);
    event.preventDefault();
  };

  const handleSave = (name: string) => {
    if (name !== "" && name !== folder.name) {
      dispatch(
        editMediaFolder(folder.id, {
          name: name,
          description: folder.description,
          parentId: folder.parentId
        })
      );
    }
    handleToggle();
  };

  const handleRemove = () => {
    confirmDeleteFolder(folder.name, () => {
      dispatch(deleteMediaFolder(folder.id));
    });
  };

  const handleMove = () => {
    dispatch(
      actions.openOverlay({
        name: `move-folder-${folder.name}`,
        // prettier-ignore
        head: <DirentMoveHeader langtag={langtag} title={i18n.t("media:move_folder")} />,
        body: <DirentMoveBody langtag={langtag} sourceFolder={folder} />,
        footer: <DirentMoveFooter langtag={langtag} sourceFolder={folder} />,
        classes: "dirent-move"
      })
    );
  };

  return (
    <div className="subfolder">
      {isEdit ? (
        <SubfolderEdit
          name={folder.name}
          onClose={handleToggle}
          onSave={handleSave}
        />
      ) : (
        <>
          <button className="subfolder__link" onClick={onClick ?? handleClick}>
            <i className="icon fa fa-folder" />
            <span>{folder.name}</span>
          </button>

          {!onClick && (
            <div className="subfolder__actions">
              {canUserEditFolders() && (
                <button
                  className="subfolder__action"
                  onClick={handleMove}
                  title={i18n.t("media:move_folder")}
                >
                  <SvgIcon icon="move" />
                </button>
              )}

              {canUserEditFolders() && (
                <button
                  className="subfolder__action"
                  onClick={handleToggle}
                  title={i18n.t("media:change_folder")}
                >
                  <i className="icon fa fa-pencil" />
                </button>
              )}

              {canUserDeleteFolders() && (
                <button
                  className="subfolder__action"
                  onClick={handleRemove}
                  title={i18n.t("media:delete_folder")}
                >
                  <i className="fa fa-trash" />
                </button>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
