var React = require('react');
var AmpersandMixin = require('ampersand-react-mixin');

var Subfolder = require('./Subfolder.jsx');
var File = require('./File.jsx');
var FileUpload = require('./FileUpload.jsx');
var Header = require('../header/Header.jsx');

var Folder = React.createClass({
  mixins : [AmpersandMixin],

  displayName : 'Folder',

  componentDidMount : function () {
    this.watch(this.props.folder.files, {reRender : false});
    this.watch(this.props.folder.subfolders, {reRender : false});
  },

  renderCurrentFolder : function () {
    var href = '';
    if (this.props.folder.parent !== null) {
      href = '/media/' + this.props.folder.parent;
    } else if (this.props.folder.id !== null) {
      href = '/media';
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
    var subfolder = this.props.folder.subfolders.map(function (folder, idx) {
      return <li key={idx}><i className="icon fa fa-folder-open"></i><Subfolder key={idx} folder={folder}/></li>
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
    var files = this.props.folder.files.map(function (file, idx) {
      return <li key={file.uuid}><i className="icon fa fa-file"></i><File key={file.uuid} file={file}/></li>
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
      <div>
        <Header key="header" title={this.props.folder.name} subtitle="Sie arbeiten im Ordner"/>

        <div id="media-wrapper">

          {this.renderCurrentFolder()}

          {this.renderSubfolders()}

          {this.renderFiles()}

          {<FileUpload folder={this.props.folder}/>}
        </div>
      </div>
    );
  }
});

module.exports = Folder;
