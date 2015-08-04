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
    var parent;
    if (this.props.folder.parent !== null) {
      parent = <a href={'/media.html?folder=' + this.props.folder.parent}>...</a>;
    } else if (this.props.folder.id !== null) {
      parent = <a href={'/media.html'}>...</a>;
    }

    var subfolder = this.props.folder.subfolders.map(function (folder, idx) {
      return <Subfolder key={idx} folder={folder}/>
    });

    var files = this.props.folder.files.map(function (file, idx) {
      return <File key={idx} file={file}/>
    });

    return (
      <div>
        <div>{parent}</div>

        <div>{this.props.folder.name + " – " + this.props.folder.description}</div>

        <div>
          <ol>
            {subfolder}
          </ol>
        </div>

        <div>
          <ol>
            {files}
          </ol>
        </div>

        {<FileUpload folder={this.props.folder}/>}
      </div>
    );
  }
});

module.exports = Folder;
