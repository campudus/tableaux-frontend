import React, {PureComponent} from "react";
import ActionCreator from "../../actions/ActionCreator";
import Navigation from "../../components/header/Navigation.jsx";
import PageTitle from "../../components/header/PageTitle.jsx";
import LanguageSwitcher from "../../components/header/LanguageSwitcher.jsx";
import FolderModel from "../../models/media/Folder";
import Folder from "./folder/Folder.jsx";
import PropTypes from "prop-types";

export default class MediaView extends PureComponent {
  static propTypes = {
    langtag: PropTypes.string.isRequired,
    folderId: PropTypes.number
  };

  state = {
    activeOverlay: null,
    currentFolder: null,
    isLoading: true
  };

  constructor(props) {
    super(props);
    this.loadFolder(this.props.folderId);
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.folderId !== this.props.folderId) {
      this.setState({
        isLoading: true
      });
      this.loadFolder(nextProps.folderId);
    }
  }

  shouldComponentUpdate(nextProps, nextState) {
    const shouldRenderPropUpdate = nextProps.langtag !== this.props.langtag;
    const shouldRenderStateUpdate = nextState.isLoading !== this.state.isLoading
      || nextState.currentFolder !== this.state.currentFolder;

    return shouldRenderPropUpdate || shouldRenderStateUpdate;
  }

  loadFolder(folderId) {
    let folder = new FolderModel({id: folderId || null});
    folder.fetch({
      data: {langtag: this.props.langtag},
      success: () => {
        let oldFolder = this.state.currentFolder;

        this.setState({
          currentFolder: folder,
          isLoading: false
        });

        // Reset old folder
        if (oldFolder) {
          this.cleanUpFolder(oldFolder);
        }
      }
    });
  }

  cleanUpFolder(folderToCleanUp) {
    folderToCleanUp.files.destructor();
    folderToCleanUp.subfolders.desctructor();
    folderToCleanUp.files.reset();
    folderToCleanUp.subfolders.reset();
    folderToCleanUp = null;
  }

  onLanguageSwitch(newLangtag) {
    ActionCreator.switchLanguage(newLangtag);
  }

  render() {
    if (!this.state.isLoading) {
      return (
        <div>
          <header>
            <Navigation langtag={this.props.langtag} />
            <LanguageSwitcher langtag={this.props.langtag} onChange={this.onLanguageSwitch} />
            <PageTitle titleKey="pageTitle.media" />
          </header>
          <Folder folder={this.state.currentFolder} langtag={this.props.langtag} />
        </div>
      );
    } else {
      // show spinner
      return null;
    }
  }
}
