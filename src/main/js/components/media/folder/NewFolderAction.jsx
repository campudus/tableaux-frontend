var React = require('react');
var AmpersandMixin = require('ampersand-react-mixin');
var NewFolderActionView = require('./NewFolderActionView.jsx');
var SubfolderEdit = require('./SubfolderEdit.jsx');
var SimpleFolder = require('../../../models/media/SimpleFolder');
var ActionCreator = require('../../../actions/ActionCreator');
import {translate} from 'react-i18next';

var NewFolderAction = React.createClass({

  mixins : [AmpersandMixin],
  propTypes : {
    parentFolder : React.PropTypes.object.isRequired
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
    console.log("Folder.added", folderId, folderName, folderDescription, folderParent);
    ActionCreator.addFolder(folderName, folderDescription, folderParent);
  },

  render : function () {
    var newFolderAction;

    const {t} = this.props;

    if (this.state.edit) {
      var folder = new SimpleFolder({
        name : t('new_folder'),
        description : "",
        parent : this.props.parentFolder.getId()
      });
      newFolderAction = <SubfolderEdit folder={folder} onSave={this.onSave} onCancel={this.onEdit}/>;
    } else {
      newFolderAction = <NewFolderActionView callback={this.onEdit}/>;
    }

    return (
      <div className="media-switcher new-folder-action">
            {newFolderAction}
      </div>
    );
  }
});

module.exports = translate(['media'])(NewFolderAction);