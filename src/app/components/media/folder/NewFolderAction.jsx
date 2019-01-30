import NewFolderActionView from "./NewFolderActionView.jsx";
import SubfolderEdit from "./SubfolderEdit";
import React from "react";
import PropTypes from "prop-types";
import { pure, compose, withHandlers, withState } from "recompose";
import f from "lodash/fp";
import { translate } from "react-i18next";

const withEditMode = compose(
  withState("edit", "updateEdit", false),
  withHandlers({
    toggleEdit: ({ updateEdit }) => () => {
      updateEdit(edit => !edit);
    },
    onSave: ({ updateEdit }) => actions => (folderId, data) => {
      const requestData = {
        parent: data.parent.id,
        name: data.name,
        description: data.description
      };
      actions.createMediaFolder(requestData);
      updateEdit(f.always(false));
    }
  })
);

const NewFolderAction = props => {
  let newFolderAction;
  const { t, onSave, toggleEdit, edit, parentFolder, actions } = props;

  if (edit) {
    const folder = {
      name: t("new_folder"),
      description: "",
      parent: parentFolder
    };
    newFolderAction = (
      <SubfolderEdit
        folder={folder}
        onSave={onSave(actions)}
        onCancel={toggleEdit}
      />
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
  folder: PropTypes.object,
  actions: PropTypes.object,
  t: PropTypes.func,
  onSave: PropTypes.func,
  toggleEdit: PropTypes.func,
  edit: PropTypes.bool
};

export default compose(
  pure,
  withEditMode,
  translate(["media"])
)(NewFolderAction);
