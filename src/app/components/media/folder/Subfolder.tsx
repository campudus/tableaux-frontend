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

type SubfolderProps = {
  langtag: string;
  folder: Folder;
};

export default function Subfolder({
  langtag,
  folder
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
      dispatch(editMediaFolder(folder.id, { name: name }));
    }
    handleToggle();
  };

  const handleRemove = () => {
    confirmDeleteFolder(folder.name, () => {
      dispatch(deleteMediaFolder(folder.id));
    });
  };

  return (
    <div className="media-subfolder">
      {isEdit ? (
        <SubfolderEdit
          name={folder.name}
          onClose={handleToggle}
          onSave={handleSave}
        />
      ) : (
        <>
          <button className="media-subfolder__link" onClick={handleClick}>
            <i className="icon fa fa-folder" />
            <span>{folder.name}</span>
          </button>

          <div className="media-subfolder__actions">
            {canUserEditFolders() && (
              <button
                className="media-subfolder__action"
                onClick={handleToggle}
                title={i18n.t("media:change_folder")}
              >
                <i className="icon fa fa-pencil" />
              </button>
            )}

            {canUserDeleteFolders() && (
              <button
                className="media-subfolder__action"
                onClick={handleRemove}
                title={i18n.t("media:delete_folder")}
              >
                <i className="fa fa-trash" />
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
