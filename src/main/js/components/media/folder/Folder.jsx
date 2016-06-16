var React = require('react');
var AmpersandMixin = require('ampersand-react-mixin');
var Subfolder = require('./Subfolder.jsx');
var File = require('./File.jsx');
var FileUpload = require('./FileUpload.jsx');
var NewFolderAction = require('./NewFolderAction.jsx');
var ActionCreator = require('../../../actions/ActionCreator');
import {isUserAdmin} from '../../../helpers/accessManagementHelper';

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
    var currentFolder = '';
    var currentFolderClass = ['current-folder'];
    if (this.props.folder.name === "root") {
      currentFolder = "Hauptordner";
    } else if (this.props.folder.name && this.props.folder.description) {
      currentFolder = this.props.folder.name + " – " + this.props.folder.description;
    } else if (this.props.folder.name) {
      currentFolder = this.props.folder.name;
    } else {
      currentFolder = "Folder " + this.props.folder.id;
    }

    if (this.props.folder.name !== "root") {
      currentFolder = <a href="#" onClick={this.backFolderHandler}>
        <span className="back"><i className="fa fa-chevron-left"/>{currentFolder}</span>
      </a>;
    } else {
      currentFolderClass.push("is-root");
    }

    return (
      <div className={currentFolderClass.join(" ")}>
        {currentFolder}
      </div>
    );
  },

  renderSubfolders : function () {
    const self = this;
    const subFolders = this.props.folder.subfolders;
    if (subFolders && subFolders.length > 0) {
      var subfolder = subFolders.map(function (folder, idx) {
        return <li key={idx}><Subfolder key={idx} folder={folder} langtag={self.props.langtag}/></li>
      });
      return (
        <div className="media-switcher">
          <ol className="media-switcher-menu">
            {subfolder}
          </ol>
        </div>
      );
    } else {
      return null;
    }
  },

  renderFiles : function () {
    const self = this;
    const files = this.props.folder.files;

    if (files && files.length > 0) {
      const filesMarkup = files.map(function (file) {
        return <li key={file.uuid}><File key={file.uuid} file={file}
                                         langtag={self.props.langtag}/></li>;
      });
      return (
        <div className="media-switcher">
          <ol className="media-switcher-menu">
            {filesMarkup}
          </ol>
        </div>
      );
    } else {
      return null;
    }
  },

  render : function () {
    const newFolderAction = isUserAdmin() ? <NewFolderAction parentFolder={this.props.folder}/> : null;
    return (
      <div id="media-wrapper">
        {this.renderCurrentFolder()}
        {newFolderAction}
        {this.renderSubfolders()}
        {this.renderFiles()}
        <FileUpload folder={this.props.folder}/>
      </div>
    );
  }

});

module.exports = Folder;
