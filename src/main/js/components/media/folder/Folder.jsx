var React = require('react');
var AmpersandMixin = require('ampersand-react-mixin');
var Subfolder = require('./Subfolder.jsx');
var File = require('./File.jsx');
var FileUpload = require('./FileUpload.jsx');
var NewFolderAction = require('./NewFolderAction.jsx');
var ActionCreator = require('../../../actions/ActionCreator');

var Folder = React.createClass({
  mixins : [AmpersandMixin],

  displayName : 'Folder',

  propTypes : {
    folder : React.PropTypes.object.isRequired,
    langtag : React.PropTypes.string.isRequired
  },

  backFolderHandler : function (event) {
    event.preventDefault();
    ActionCreator.switchFolder(this.props.folder.parent, this.props.langtag);
  },

  renderCurrentFolder : function () {
    var parent = null;
    if (this.props.folder.name !== "root") {
      parent =
        <span className="back"><a onClick={this.backFolderHandler}><i className="fa fa-chevron-left"></i></a></span>;
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

  render : function () {
    return (
      <div id="media-wrapper">

        {this.renderCurrentFolder()}

        <NewFolderAction parentFolder={this.props.folder}/>

        {this.renderSubfolders()}

        {this.renderFiles()}

        <FileUpload folder={this.props.folder}/>
      </div>
    );
  }

});

module.exports = Folder;
