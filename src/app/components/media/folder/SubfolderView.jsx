import React from "react";
import PropTypes from "prop-types";
import f from "lodash/fp";
import { isUserAdmin } from "../../../helpers/accessManagementHelper";
import { translate } from "react-i18next";
import { branch, compose, pure, renderNothing, withHandlers } from "recompose";
import TableauxRouter from "../../../router/router";

const MediaOptions = compose(
  branch(() => !isUserAdmin(), renderNothing),
  pure
)(props => (
  <div className="media-options">
    <span className="button" onClick={props.onEdit} alt="edit">
      <i className="icon fa fa-pencil-square-o" />
      {props.t("rename_folder")}
    </span>
    <span
      className="button"
      onClick={props.onRemove}
      alt={props.t("delete_folder")}
    >
      <i className="fa fa-trash" />
    </span>
  </div>
));

const enhance = compose(
  withHandlers({
    onFolderClick: props => event => {
      const folderId = f.get(["folder", "id"], props);

      TableauxRouter.switchFolderHandler(folderId, f.get("langtag", props));
      event.preventDefault();
    }
  }),
  pure,
  translate(["media"])
);

const SubfolderView = props => {
  return (
    <div>
      <a className="folder-link" onClick={props.onFolderClick}>
        <i className="icon fa fa-folder-open" />
        <span>{props.folder.name}</span>
      </a>
      <MediaOptions {...props} />
    </div>
  );
};

SubfolderView.propTypes = {
  folder: PropTypes.object.isRequired,
  langtag: PropTypes.string.isRequired,
  onRemove: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired,
  onFolderClick: PropTypes.func.isRequired
};

export default enhance(SubfolderView);
