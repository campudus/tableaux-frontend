import React from "react";
import PropTypes from "prop-types";
import SubfolderView from "./SubfolderView";
import { translate } from "react-i18next";
import SubfolderEdit from "./SubfolderEdit.jsx";
import {
  confirmDeleteFolder,
  simpleError
} from "../../../components/overlay/ConfirmationOverlay";
import {
  branch,
  compose,
  pure,
  renderComponent,
  withHandlers,
  withState
} from "recompose";
import f from "lodash/fp";

const withToggleableEditState = compose(
  withState("edit", "updateEditState", f.constant(false)),
  withHandlers({
    onEdit: ({ updateEditState }) => () => updateEditState(editing => !editing)
  })
);

const withButtonHandlers = withHandlers({
  onSave: props => (folderId, folderName, folderDescription, folderParent) => {
    const { t } = props;
    props.onEdit();
    console.log(
      "Folder.changed",
      folderId,
      folderName,
      folderDescription,
      folderParent
    );
  },
  onCancel: props => props.onEdit,
  onRemove: props => () => {
    confirmDeleteFolder(
      props.folder.name,
      () => {
        console.log("Folder.onRemove", props.folder.getId());
      },
      () => {}
    );
  }
});

const withEditMode = branch(
  props => props.edit,
  renderComponent(SubfolderEdit)
);

const ViewComponent = compose(
  withToggleableEditState,
  withButtonHandlers,
  withEditMode,
  pure
)(props => <SubfolderView {...props} />);

const Subfolder = props => {
  return (
    <div className="subfolder">
      <ViewComponent {...props} />
    </div>
  );
};

Subfolder.propTypes = {
  folder: PropTypes.object.isRequired,
  langtag: PropTypes.string.isRequired
};

module.exports = compose(
  translate(["media"]),
  pure
)(Subfolder);
