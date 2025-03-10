/* eslint react/no-this-in-sfc: 0 */

import { List, AutoSizer, WindowScroller } from "react-virtualized";
import { translate } from "react-i18next";
import { withRouter } from "react-router-dom";
import React, { Component } from "react";
import f from "lodash/fp";

import PropTypes from "prop-types";

import { canUserCreateFolders } from "../../../helpers/accessManagementHelper";
import { switchFolderHandler } from "../../Router";
import File from "./File.jsx";
import FileUpload from "./FileUpload.jsx";
import NewFolderAction from "./NewFolderAction.jsx";
import Subfolder from "./Subfolder.jsx";

class Folder extends Component {
  constructor(props) {
    super(props);
  }

  backFolderHandler = e => {
    const { langtag, folder, history } = this.props;
    const parentId = f.get("parent", folder);

    switchFolderHandler(history, langtag, parentId);
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
        <button onClick={this.backFolderHandler}>
          <span className="back">
            <i className="fa fa-chevron-left" />
            {currentFolder}
          </span>
        </button>
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

  renderFileForIndex = preparedFiles => ({ index, style }) => {
    const { langtag, actions, modifiedFiles } = this.props;

    const file = preparedFiles[index];

    return (
      <ol key={index} className="media-switcher-menu" style={style}>
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
      </ol>
    );
  };

  renderFiles = () => {
    const {
      folder: { files }
    } = this.props;

    // show newest or recently updated files on top
    const sortAndMarkup = f.flow(
      f.sortBy(f.prop("updatedAt")),
      f.reverse
    );

    const preparedFiled = sortAndMarkup(files);

    if (files && f.size(files) > 0) {
      return (
        <div className="media-switcher">
          <WindowScroller>
            {scrollerProps => (
              <AutoSizer disableHeight>
                {sizerProps => (
                  <List
                    autoHeight
                    width={sizerProps.width}
                    height={scrollerProps.height}
                    rowCount={files.length}
                    overscanRowCount={10}
                    rowHeight={41}
                    rowRenderer={this.renderFileForIndex(preparedFiled)}
                    scrollTop={scrollerProps.scrollTop}
                  />
                )}
              </AutoSizer>
            )}
          </WindowScroller>
        </div>
      );
    } else {
      return null;
    }
  };

  render() {
    const { folder, actions, langtag } = this.props;
    const newFolderAction = canUserCreateFolders() ? (
      <NewFolderAction parentFolder={folder} actions={actions} />
    ) : null;

    return (
      <div id="media-wrapper">
        {this.renderCurrentFolder()}
        {newFolderAction}
        {this.renderSubfolders()}
        {this.renderFiles()}
        <FileUpload langtag={langtag} actions={actions} folder={folder} />
      </div>
    );
  }
}

Folder.propTypes = {
  folder: PropTypes.object.isRequired,
  langtag: PropTypes.string.isRequired,
  actions: PropTypes.object.isRequired,
  modifiedFiles: PropTypes.array
};

export default f.flow(
  translate(["media"]),
  withRouter
)(Folder);
