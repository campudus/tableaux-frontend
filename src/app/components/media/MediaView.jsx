import { withRouter, Redirect } from "react-router-dom";
import React, { Component } from "react";
import f from "lodash/fp";

import PropTypes from "prop-types";

import { simpleError } from "../overlay/ConfirmationOverlay";
import { switchLanguageHandler } from "../Router";
import Folder from "./folder/Folder.jsx";
import GrudHeader from "../GrudHeader";
import ReduxActionHoc from "../../helpers/reduxActionHoc";
import Spinner from "../header/Spinner";

const mapStateToProps = state => {
  return {
    media: f.get("media", state)
  };
};

class MediaView extends Component {
  constructor(props) {
    super(props);

    this.state = { modifiedFiles: [] };

    this.onLanguageSwitch = this.onLanguageSwitch.bind(this);
  }

  componentDidUpdate(lastProps) {
    const finishedLoading = this.props.media.finishedLoading;

    if (finishedLoading) {
      const oldFolderId = lastProps.media.data.id;
      const newFolderId = this.props.media.data.id;
      const isFolderChange = oldFolderId !== newFolderId;

      const oldFiles = lastProps.media.data.files;
      const newFiles = this.props.media.data.files;
      const oldFileCount = f.size(oldFiles);
      const newFileCount = f.size(newFiles);

      // add new fileIDs to state for highlighting
      if (
        !isFolderChange &&
        oldFileCount !== 0 &&
        oldFileCount < newFileCount
      ) {
        const newUUIDs = f.map(newFile => {
          if (!f.find(oldFile => oldFile.uuid === newFile.uuid, oldFiles)) {
            return newFile.uuid;
          }
        }, newFiles);

        this.setState({ modifiedFiles: f.compact(newUUIDs) });
      } else if (isFolderChange) {
        this.setState({ modifiedFiles: [] });
      }
    }
  }

  onLanguageSwitch = newLangtag => {
    switchLanguageHandler(this.props.history, newLangtag);
  };

  getFolderUrl = () => {
    const { langtag, media } = this.props;
    const suffix =
      media.finishedLoading && media.data.id ? `/${media.data.id}` : "";
    return `/${langtag}/media` + suffix;
  };

  render() {
    const { langtag, media, actions } = this.props;
    const { modifiedFiles } = this.state;

    if (media.error) {
      simpleError(actions);
    }

    return (
      <div>
        <GrudHeader
          langtag={langtag}
          handleLanguageSwitch={this.onLanguageSwitch}
          pageTitleOrKey="pageTitle.media"
        />
        {media.finishedLoading ? (
          <Folder
            folder={media.data}
            langtag={langtag}
            actions={actions}
            modifiedFiles={modifiedFiles}
          />
        ) : (
          <Spinner isLoading />
        )}
        {media.finishedLoading && <Redirect to={this.getFolderUrl()} />}
      </div>
    );
  }
}

MediaView.propTypes = {
  langtag: PropTypes.string.isRequired,
  media: PropTypes.object.isRequired,
  actions: PropTypes.object.isRequired,
  folderId: PropTypes.number
};

export default ReduxActionHoc(withRouter(MediaView), mapStateToProps);
