var React = require('react');
var Subfolder = require('./Subfolder.jsx');
var File = require('./File.jsx');
var FileUpload = require('./FileUpload.jsx');
var AmpersandMixin = require('ampersand-react-mixin');

var Folder = React.createClass({
  mixins : [AmpersandMixin],

  displayName : 'Folder',

  componentWillMount : function () {
    this.props.folder.fetch();
  },

  componentDidMount : function () {
    this.watch(this.props.folder.files, {reRender : false});
    this.watch(this.props.folder.subfolders, {reRender : false});
  },

  render : function () {
    var parent = '';
    if (this.props.folder.parent !== null) {
      parent = <div><i className="fa fa-chevron-left"></i><a href={'/media/' + this.props.folder.parent}>Back</a></div>;
    } else if (this.props.folder.id !== null) {
      parent = <div><i className="fa fa-chevron-left"></i><a href={'/media'}>Back</a></div>;
    }

    var subfolder = this.props.folder.subfolders.map(function (folder, idx) {
      return <li><i className="icon fa fa-folder-open"></i><Subfolder key={idx} folder={folder}/></li>
    });

    var files = this.props.folder.files.map(function (file, idx) {
      return <li><i className="icon fa fa-file"></i><File key={idx} file={file}/></li>
    });

    return (
      <div id="media-wrapper">

        <div className="current-folder">
          <div>{parent}</div>
          <div>{this.props.folder.name + " – " + this.props.folder.description}</div>
        </div>

        <div className="media-switcher">
          <ol className="media-switcher-menu">
            {subfolder}
          </ol>
        </div>

        <div className="media-switcher">
          <ol className="media-switcher-menu">
            {files}
          </ol>
        </div>

        {<FileUpload folder={this.props.folder}/>}
      </div>
    );
  }
});

module.exports = Folder;
