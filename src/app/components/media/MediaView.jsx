import { compose, withProps } from "recompose";
import React, { Component } from "react";

import PropTypes from "prop-types";
import f from "lodash/fp";

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
  static propTypes = {
    langtag: PropTypes.string.isRequired,
    folderId: PropTypes.number,
    media: PropTypes.object,
    actions: PropTypes.object
  };

  constructor(props) {
    super(props);

    this.onLanguageSwitch = this.onLanguageSwitch.bind(this);
  }

  // componentWillReceiveProps(nextProps) {}

  // shouldComponentUpdate(nextProps, nextState) {}

  onLanguageSwitch(newLangtag) {
    const oldLangtag = this.props.langtag;
    const history = TableauxRouter.history;
    const url = history.getPath();
    history.navigate(url.replace(oldLangtag, newLangtag));
  }

  render() {
    const { langtag, media, actions, requestedData } = this.props;

    if (requestedData) {
      TableauxConstants.initLangtags(this.props.requestedData.value);
    }

    if (media.error) {
      console.log("MediaView -> state returned a error!");
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
          <Folder folder={media.data} langtag={langtag} actions={actions} />
        </div>
      );
    } else {
      // show spinner while waiting for state to finish loading
      return null;
    }
  }
}

export default compose(enhance)(ReduxActionHoc(MediaView, mapStateToProps));
