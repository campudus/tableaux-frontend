import React, { Component } from "react";
import PropTypes from "prop-types";
import f from "lodash/fp";

import Folder from "./folder/Folder.jsx";
import Navigation from "../../components/header/Navigation.jsx";
import PageTitle from "../../components/header/PageTitle.jsx";
// import LanguageSwitcher from "../../components/header/LanguageSwitcher.jsx";
import ReduxActionHoc from "../../helpers/reduxActionHoc.js";

/*
TODO-W
-> LanguageSwitcher
-> create folder
-> files/upload
-> rename and delete
*/

const mapStateToProps = state => {
  return { media: f.get("media")(state) };
};

class MediaView extends Component {
  static propTypes = {
    langtag: PropTypes.string.isRequired,
    folderId: PropTypes.number,
    media: PropTypes.object
  };

  state = {
    activeOverlay: null
  };

  constructor(props) {
    super(props);
  }

  // componentWillReceiveProps(nextProps) {}

  // shouldComponentUpdate(nextProps, nextState) {}

  onLanguageSwitch(newLangtag) {
    // TODO-W implement onLanguageSwitch
  }

  render() {
    const { langtag, media } = this.props;
    if (media.finishedLoading) {
      return (
        <div>
          <header>
            <Navigation langtag={langtag} />
            <div className="header-separator" />
            <PageTitle titleKey="pageTitle.media" />
            {/*<LanguageSwitcher langtag={this.props.langtag} onChange={this.onLanguageSwitch} />*/}
          </header>
          <Folder folder={media.data} langtag={langtag} />
        </div>
      );
    } else {
      // show spinner while waiting for state to finish loading
      return null;
    }
  }
}

export default ReduxActionHoc(MediaView, mapStateToProps);
