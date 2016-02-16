import React from 'react';
import App from 'ampersand-app';
import Dispatcher from '../../dispatcher/Dispatcher';
import ActionCreator from '../../actions/ActionCreator';

import NavigationList from '../../components/header/NavigationList.jsx';
import PageTitle from '../../components/header/PageTitle.jsx';
import LanguageSwitcher from '../../components/header/LanguageSwitcher.jsx';

import FolderModel from '../../models/media/Folder';
import Folder from './folder/Folder.jsx';

export default class MediaView extends React.Component {
  static propTypes = {
    langtag : React.PropTypes.string.isRequired,
    folderId : React.PropTypes.number
  };

  state = {
    activeOverlay : null,
    currentFolder : null,
    isLoading : true
  };

  constructor(props) {
    super(props);
    this.loadFolder(this.props.folderId);
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.folderId !== this.props.folderId) {
      this.setState({
        isLoading : true
      });
      this.loadFolder(nextProps.folderId);
    }
  }

  shouldComponentUpdate(nextProps, nextState) {
    var shouldRenderPropUpdate = nextProps.langtag !== this.props.langtag;
    var shouldRenderStateUpdate = nextState.isLoading !== this.state.isLoading || nextState.currentFolder !== this.state.currentFolder;
    return shouldRenderPropUpdate || shouldRenderStateUpdate;
  }

  loadFolder(folderId) {
    let folder = new FolderModel({id : folderId || null});
    folder.fetch({
      data : {langtag : this.props.langtag},
      success : () => {
        this.setState({
          currentFolder : folder,
          isLoading : false
        });
      }
    });
  }

  onLanguageSwitch(newLangtag) {
    ActionCreator.switchLanguage(newLangtag);
  }

  render() {
    if (!this.state.isLoading) {
      return (
        <div>
          <header>
            <NavigationList langtag={this.props.langtag}/>
            <LanguageSwitcher langtag={this.props.langtag} onChange={this.onLanguageSwitch}/>
            <PageTitle titleKey="pageTitle.media"/>
          </header>
          <Folder folder={this.state.currentFolder} langtag={this.props.langtag}/>
        </div>
      );
    } else {
      return <div className="spinner">loading</div>
    }
  }
}