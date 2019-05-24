import { compose, withProps } from "recompose";
import React, { Component } from "react";
import f from "lodash/fp";

import PropTypes from "prop-types";

import { simpleError } from "../overlay/ConfirmationOverlay";
import Folder from "./folder/Folder.jsx";
import GrudHeader from "../GrudHeader";
import ReduxActionHoc from "../../helpers/reduxActionHoc.js";
import TableauxConstants from "../../constants/TableauxConstants";
import TableauxRouter from "../../router/router";
import apiUrl from "../../helpers/apiUrl";
import needsApiData from "../helperComponents/needsAPIData";
import route from "../../helpers/apiRoutes";

const mapStateToProps = state => {
  return {
    media: f.get("media", state)
  };
};

const enhance = compose(
  withProps(() => {
    return { requestUrl: apiUrl(route.toSetting("langtags")) };
  }),
  needsApiData
);

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

  onLanguageSwitch(newLangtag) {
    TableauxRouter.switchLanguageHandler(newLangtag);
  }

  render() {
    const { langtag, media, actions, requestedData } = this.props;
    const { modifiedFiles } = this.state;

    if (requestedData) {
      TableauxConstants.initLangtags(this.props.requestedData.value);
    }

    if (media.error) {
      simpleError(actions);
    }

    if (media.finishedLoading && requestedData) {
      return (
        <div>
          <GrudHeader
            langtag={langtag}
            handleLanguageSwitch={this.onLanguageSwitch}
            pageTitleOrKey="pageTitle.media"
          />
          <Folder
            folder={media.data}
            langtag={langtag}
            actions={actions}
            modifiedFiles={modifiedFiles}
          />
        </div>
      );
    } else {
      // show spinner while waiting for state to finish loading
      return null;
    }
  }
}

MediaView.propTypes = {
  langtag: PropTypes.string.isRequired,
  media: PropTypes.object.isRequired,
  actions: PropTypes.object.isRequired,
  folderId: PropTypes.number
};

export default compose(enhance)(ReduxActionHoc(MediaView, mapStateToProps));
