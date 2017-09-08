import React from "react";
import PropTypes from "prop-types";
import ActionCreator from "../../../actions/ActionCreator";
import {isUserAdmin} from "../../../helpers/accessManagementHelper";
import {translate} from "react-i18next";
import {branch, compose, pure, renderNothing, withHandlers} from "recompose";
import connectToAmpersand from "../../helperComponents/connectToAmpersand";

const MediaOptions = compose(
  branch(
    () => !isUserAdmin(),
    renderNothing
  ),
  pure
)(
  (props) => (
    <div className="media-options">
          <span className="button" onClick={props.onEdit} alt="edit">
          <i className="icon fa fa-pencil-square-o"></i>{props.t("rename_folder")}
        </span>
      <span className="button" onClick={props.onRemove} alt={props.t("delete_folder")}>
          <i className="fa fa-trash"></i>
        </span>
    </div>
  )
);

const enhance = compose(
  withHandlers({
    onFolderClick: (props) => (event) => {
      event.preventDefault();
      ActionCreator.switchFolder(props.folder.id, props.langtag);
    }
  }),
  pure,
  translate(["media"]),
  connectToAmpersand
);

const SubfolderView = (props) => {
  return (
    <div>
      <a className="folder-link" onClick={props.onFolderClick}>
        <i className="icon fa fa-folder-open"></i><span>{props.folder.name}</span>
      </a>
      <MediaOptions {...props} />
    </div>
  );
};

SubfolderView.propTypes = {
  folder: PropTypes.object.isRequired,
  langtag: PropTypes.string.isRequired,
  onRemove: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired
};

export default enhance(SubfolderView);
