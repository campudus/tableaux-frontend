import NewFolderActionView from "./NewFolderActionView.jsx";
import SubfolderEdit from "./SubfolderEdit";
import {simpleError} from "../../../components/overlay/ConfirmationOverlay";
import React from "react";
import ActionCreator from "../../../actions/ActionCreator";
import SimpleFolder from "../../../models/media/SimpleFolder";
import PropTypes from "prop-types";
import {pure, compose, withHandlers, withState} from "recompose";
import f from "lodash/fp";
import {translate} from "react-i18next";

const withEditMode = compose(
  withState("edit", "updateEdit", false),
  withHandlers({
    toggleEdit: ({updateEdit}) => () => updateEdit(edit => !edit),
    onSave: ({t, updateEdit}) => (folderId, folderName, folderDescription, folderParent) => {
      updateEdit(f.always(false));
      ActionCreator.addFolder(folderName, folderDescription, folderParent,
        () => simpleError(t("error_folder_exists_already")));
    }
  })
);

const NewFolderAction = (props) => {
  let newFolderAction;
  const {t, onSave, toggleEdit, edit} = props;

  if (edit) {
    let folder = new SimpleFolder({
      name: t("new_folder"),
      description: "",
      parent: props.parentFolder.getId()
    });
    newFolderAction = <SubfolderEdit folder={folder} onSave={onSave} onCancel={toggleEdit} />;
  } else {
    newFolderAction = <NewFolderActionView callback={toggleEdit} />;
  }

  return (
    <div className="media-switcher new-folder-action">
      {newFolderAction}
    </div>
  );
};

NewFolderAction.propTypes = {
  parentFolder: PropTypes.object,
  folder: PropTypes.object
};

export default compose(
  pure,
  withEditMode,
  translate(["media"])
)(NewFolderAction);
