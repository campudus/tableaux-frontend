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
    <div className="subfolder">
      {isEdit ? (
        <SubfolderEdit
          name={folder.name}
          onClose={handleToggle}
          onSave={handleSave}
        />
      ) : (
        <div>
          <button className="folder-link" onClick={handleClick}>
            <i className="icon fa fa-folder-open" />
            <span>{folder.name}</span>
          </button>
          <div className="media-options">
            {canUserEditFolders() && (
              <span className="button" onClick={handleToggle}>
                <i className="icon fa fa-pencil-square-o" />
                {i18n.t("media:rename_folder")}
              </span>
            )}
            {canUserDeleteFolders() && (
              <span className="button" onClick={handleRemove}>
                <i className="fa fa-trash" />
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
