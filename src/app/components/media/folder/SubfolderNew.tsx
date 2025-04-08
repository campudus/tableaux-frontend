import i18n from "i18next";
import { useDispatch } from "react-redux";
import { ReactElement, useState } from "react";
import { Folder } from "../../../types/grud";
import { createMediaFolder } from "../../../redux/actions/mediaActions";
import SubfolderEdit from "./SubfolderEdit";

type SubfolderNewProps = {
  parent: Partial<Folder>;
};

export default function SubfolderNew({
  parent
}: SubfolderNewProps): ReactElement {
  const dispatch = useDispatch();
  const [isEdit, setIsEdit] = useState(false);
  const folderName = i18n.t("media:new_folder");

  const handleToggle = () => {
    setIsEdit(edit => !edit);
  };

  const handleSave = (name: string) => {
    if (name !== "" && name !== folderName) {
      dispatch(createMediaFolder({ parent: parent.id, name, description: "" }));
    }
    handleToggle();
  };

  return (
    <div className="media-switcher new-folder-action">
      {isEdit ? (
        <SubfolderEdit
          name={folderName}
          onClose={handleToggle}
          onSave={handleSave}
        />
      ) : (
        <div className="new-folder-button" onClick={handleToggle}>
          <i className="icon fa fa-plus" />
          <span>{i18n.t("media:create_new_folder")}</span>
        </div>
      )}
    </div>
  );
}
