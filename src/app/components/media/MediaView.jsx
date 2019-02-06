import { compose, withProps } from "recompose";
import React, { Component } from "react";

import PropTypes from "prop-types";
import f from "lodash/fp";
import i18n from "i18next";

import { simpleError } from "../overlay/ConfirmationOverlay";
import Folder from "./folder/Folder.jsx";
import LanguageSwitcher from "../header/LanguageSwitcher";
import Navigation from "../../components/header/Navigation.jsx";
import PageTitle from "../../components/header/PageTitle.jsx";
import ReduxActionHoc from "../../helpers/reduxActionHoc.js";
import TableauxConstants from "../../constants/TableauxConstants";
import TableauxRouter from "../../router/router";
import needsApiData from "../helperComponents/needsAPIData";

const mapStateToProps = state => {
  return { media: f.get("media", state) };
};

const enhance = compose(
  withProps(() => {
    return { requestUrl: "/api/system/settings/langtags" };
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
    const oldLangtag = this.props.langtag;
    const history = TableauxRouter.history;
    const url = history.getPath();
    i18n.changeLanguage(newLangtag);
    history.navigate(url.replace(oldLangtag, newLangtag));
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
          <header>
            <Navigation langtag={langtag} />
            <div className="header-separator" />
            <PageTitle titleKey="pageTitle.media" />
            <LanguageSwitcher
              langtag={langtag}
              onChange={this.onLanguageSwitch}
            />
          </header>
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
