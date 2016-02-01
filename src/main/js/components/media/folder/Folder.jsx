var React = require('react');
var AmpersandMixin = require('ampersand-react-mixin');
var Dispatcher = require('../../../dispatcher/Dispatcher');
var Subfolder = require('./Subfolder.jsx');
var File = require('./File.jsx');
var FileUpload = require('./FileUpload.jsx');
var NewFolderAction = require('./NewFolderAction.jsx');
var LanguageSwitcher = require('../../header/LanguageSwitcher.jsx');
var NavigationList = require('../../header/NavigationList.jsx');
var PageTitle = require('../../header/PageTitle.jsx');
var GenericOverlay = require('../../overlay/GenericOverlay.jsx');
var App = require('ampersand-app');

var Folder = React.createClass({
  mixins : [AmpersandMixin],

  displayName : 'Folder',

  propTypes : {
    folder : React.PropTypes.object.isRequired,
    langtag : React.PropTypes.string.isRequired
  },

  getInitialState : function () {
    return {
      activeOverlay : null //holds null or { head:{}, body:{}, type:""}
    }
  },

  componentDidMount : function () {
    this.watch(this.props.folder.files, {reRender : false});
    this.watch(this.props.folder.subfolders, {reRender : false});
  },

  componentWillMount : function () {
    Dispatcher.on('open-overlay', this.openOverlay);
    Dispatcher.on('close-overlay', this.closeOverlay);
  },

  componentWillUnmount : function () {
    Dispatcher.off('open-overlay', this.openOverlay);
    Dispatcher.off('close-overlay', this.closeOverlay);
  },

  renderCurrentFolder : function () {
    var href = '';
    if (this.props.folder.parent !== null) {
      href = '/' + this.props.langtag + '/media/' + this.props.folder.parent;
    } else if (this.props.folder.id !== null) {
      href = '/' + this.props.langtag + '/media';
    }

    var parent = null;
    if (this.props.folder.name !== "root") {
      parent = <span className="back"><a href={href}><i className="fa fa-chevron-left"></i></a></span>;
    }

    var currentFolder = '';
    if (this.props.folder.name === "root") {
      currentFolder = "Hauptordner";
    } else if (this.props.folder.name && this.props.folder.description) {
      currentFolder = this.props.folder.name + " – " + this.props.folder.description;
    } else if (this.props.folder.name) {
      currentFolder = this.props.folder.name;
    } else {
      currentFolder = "Folder " + this.props.folder.id;
    }

    return (
      <div className="current-folder">
        <div>{parent} {currentFolder}</div>
      </div>
    );
  },

  renderSubfolders : function () {
    var self = this;
    var subfolder = this.props.folder.subfolders.map(function (folder, idx) {
      return <li key={idx}><Subfolder key={idx} folder={folder} langtag={self.props.langtag}/></li>
    });

    return (
      <div className="media-switcher">
        <ol className="media-switcher-menu">
          {subfolder}
        </ol>
      </div>
    );
  },

  openOverlay : function (content) {
    this.setState({activeOverlay : content});
  },

  closeOverlay : function () {
    this.setState({activeOverlay : null});
  },

  renderActiveOverlay : function () {
    var overlay = this.state.activeOverlay;
    if (overlay) {
      return (<GenericOverlay key="genericoverlay"
                              head={overlay.head}
                              body={overlay.body}
                              type={overlay.type}
                              closeOnBackgroundClicked={overlay.closeOnBackgroundClicked}
      />);
    }
  },

  renderFiles : function () {
    var self = this;

    var files = this.props.folder.files.map(function (file) {
      return <li key={file.uuid}><File key={file.uuid} file={file}
                                       langtag={self.props.langtag}/></li>;
    });

    return (
      <div className="media-switcher">
        <ol className="media-switcher-menu">
          {files}
        </ol>
      </div>
    );
  },

  renderMediaManagement : function () {
    return (
      <div id="media-wrapper">

        {this.renderCurrentFolder()}

        <NewFolderAction parentFolder={this.props.folder}/>

        {this.renderSubfolders()}

        {this.renderFiles()}

        <FileUpload folder={this.props.folder} />
      </div>
    );
  },

  onLanguageSwitch : function (newLangtag) {
    var his = App.router.history;

    var path = his.getPath();

    var newPath = path.replace(this.props.langtag, newLangtag);

    his.navigate(newPath, {trigger : true});
  },

  //<Header key="header" title={this.props.folder.name} subtitle="Sie arbeiten im Ordner" langtag={this.props.langtag}/>

  render : function () {
    return (
      <div>
        <header>
          <NavigationList langtag={this.props.langtag}/>
          <LanguageSwitcher langtag={this.props.langtag} onChange={this.onLanguageSwitch}/>
          <PageTitle title="Media Management"/>
        </header>
        {this.renderMediaManagement()}
        {this.renderActiveOverlay()}
      </div>
    );
  }
});

module.exports = Folder;
