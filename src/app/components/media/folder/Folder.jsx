import React, { Component } from "react";
import f from "lodash/fp";
import NewFolderAction from "./NewFolderAction.jsx";
import { isUserAdmin } from "../../../helpers/accessManagementHelper";
import { translate } from "react-i18next";
import Subfolder from "./Subfolder.jsx";
import File from "./File.jsx";
import FileUpload from "./FileUpload.jsx";
import PropTypes from "prop-types";
import TableauxRouter from "../../../router/router";

@translate(["media"])
class Folder extends Component {
  constructor(props) {
    super(props);
    this.state = { modifiedFiles: [] };
  }

  backFolderHandler = e => {
    const { langtag, folder } = this.props;
    const parentId = f.get("parent", folder);

    TableauxRouter.switchFolderHandler(parentId, langtag);
    e.preventDefault();
  };

  renderCurrentFolder = () => {
    const { id, name, description } = this.props.folder;
    let currentFolder = "";
    const currentFolderClass = ["current-folder"];
    if (name === "root") {
      currentFolder = this.props.t("root_folder_name");
    } else if (name && description) {
      currentFolder = name + " – " + description;
    } else if (name) {
      currentFolder = name;
    } else {
      currentFolder = "Folder " + id;
    }

    if (name !== "root") {
      currentFolder = (
        <a href="#" onClick={this.backFolderHandler}>
          <span className="back">
            <i className="fa fa-chevron-left" />
            {currentFolder}
          </span>
        </a>
      );
    } else {
      currentFolderClass.push("is-root");
    }

    return <div className={currentFolderClass.join(" ")}>{currentFolder}</div>;
  };

  renderSubfolders = () => {
    const subFolders = this.props.folder.subfolders;
    const { langtag, actions } = this.props;
    if (subFolders && subFolders.length > 0) {
      const subfolder = subFolders.map((folder, idx) => {
        return (
          <li key={idx}>
            <Subfolder
              key={idx}
              folder={folder}
              langtag={langtag}
              actions={actions}
            />
          </li>
        );
      });
      return (
        <div className="media-switcher">
          <ol className="media-switcher-menu">{subfolder}</ol>
        </div>
      );
    } else {
      return null;
    }
  };

  renderFiles = () => {
    const files = this.props.folder.files;
    const { langtag, actions } = this.props;
    const { modifiedFiles } = this.state;

    const sortAndMarkup = f.compose(
      f.map(file => {
        return (
          <li
            key={file.uuid}
            className={
              f.contains(file.uuid, modifiedFiles) ? "modified-file" : ""
            }
          >
            <File
              key={file.uuid}
              file={file}
              langtag={langtag}
              actions={actions}
            />
          </li>
        );
      }),
      f.reverse, // keep latest first
      f.sortBy(f.prop("updatedAt"))
    );

    if (files && f.size(files) > 0) {
      return (
        <div className="media-switcher">
          <ol className="media-switcher-menu">{sortAndMarkup(files)}</ol>
        </div>
      );
    } else {
      return null;
    }
  };

  render() {
    const { folder, actions, langtag } = this.props;
    const newFolderAction = isUserAdmin() ? (
      <NewFolderAction parentFolder={folder} actions={actions} />
    ) : null;
    return (
      <div id="media-wrapper">
        {this.renderCurrentFolder()}
        {newFolderAction}
        {this.renderSubfolders()}
        {this.renderFiles()}
        <FileUpload folder={folder} actions={actions} langtag={langtag} />
      </div>
    );
  }
}

Folder.propTypes = {
  folder: PropTypes.object.isRequired,
  langtag: PropTypes.string.isRequired,
  actions: PropTypes.object.isRequired
};

export default Folder;
