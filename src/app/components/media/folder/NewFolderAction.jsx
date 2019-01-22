import NewFolderActionView from "./NewFolderActionView.jsx";
import SubfolderEdit from "./SubfolderEdit";
import { simpleError } from "../../../components/overlay/ConfirmationOverlay";
import React from "react";
import PropTypes from "prop-types";
import { pure, compose, withHandlers, withState } from "recompose";
import f from "lodash/fp";
import { translate } from "react-i18next";

const withEditMode = compose(
  withState("edit", "updateEdit", false),
  withHandlers({
    toggleEdit: ({ updateEdit }) => () => {
      // TODO-W make this work again
      console.log("toggleEdit!", updateEdit);
      updateEdit(edit => !edit);
    },
    onSave: ({ t, updateEdit }) => (
      folderId,
      folderName,
      folderDescription,
      folderParent
    ) => {
      // TODO-W make this work again
      console.log("onSave!", updateEdit);
      updateEdit(f.always(false));
    }
  })
);

const NewFolderAction = props => {
  let newFolderAction;
  const { t, onSave, toggleEdit, edit, parent } = props;

  if (edit) {
    const folder = {
      name: t("new_folder"),
      description: "",
      parent: parent
    };
    newFolderAction = (
      <SubfolderEdit folder={folder} onSave={onSave} onCancel={toggleEdit} />
    );
  } else {
    newFolderAction = <NewFolderActionView callback={toggleEdit} />;
  }

  return (
    <div className="media-switcher new-folder-action">{newFolderAction}</div>
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
