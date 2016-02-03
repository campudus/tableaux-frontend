var React = require('react');
var AmpersandMixin = require('ampersand-react-mixin');
var ActionCreator = require('../../../actions/ActionCreator');
var SubfolderView = require('./SubfolderView.jsx');
var SubfolderEdit = require('./SubfolderEdit.jsx');

var Subfolder = React.createClass({
  mixins : [AmpersandMixin],

  displayName : 'Subfolder',

  propTypes : {
    folder : React.PropTypes.object.isRequired,
    langtag : React.PropTypes.string.isRequired
  },

  getInitialState : function () {
    return {
      edit : false
    }
  },

  onEdit : function () {
    this.setState({
      edit : !this.state.edit
    });
  },

  onSave : function (folderId, folderName, folderDescription, folderParent) {
    this.onEdit();
    console.log("Folder.changed", folderId, folderName, folderDescription, folderParent);
    ActionCreator.changeFolder(folderId, folderName, folderDescription, folderParent);
  },

  onRemove : function () {
    if (confirm("Soll der Ordner '" + this.props.folder.name + "' wirklich gelöscht werden? Es werden auch alle Unterordner und enthaltene Dateien gelöscht. Dies kann nicht rückgängig gemacht werden!")) {
      console.log('Folder.onRemove', this.props.folder.getId());
      ActionCreator.removeFolder(this.props.folder.id);
    }
  },

  render : function () {
    var subfolder;
    if (this.state.edit) {
      subfolder = <SubfolderEdit folder={this.props.folder} onSave={this.onSave} onCancel={this.onEdit}/>;
    } else {
      subfolder = <SubfolderView folder={this.props.folder}
                                 langtag={this.props.langtag}
                                 onRemove={this.onRemove}
                                 onEdit={this.onEdit}/>;
    }

    return (
      <div className="subfolder">
        {subfolder}
      </div>
    );
  }
});

module.exports = Subfolder;