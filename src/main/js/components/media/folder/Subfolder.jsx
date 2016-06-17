var React = require('react');
var AmpersandMixin = require('ampersand-react-mixin');
var ActionCreator = require('../../../actions/ActionCreator');
var SubfolderView = require('./SubfolderView.jsx');
var SubfolderEdit = require('./SubfolderEdit.jsx');
import {translate} from 'react-i18next';

var Subfolder = React.createClass({
  mixins : [AmpersandMixin],

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
    const {t} = this.props;
    if (confirm(t('confirm_delete_folder_question', {folderName : this.props.folder.name}))) {
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

module.exports = translate(['media'])(Subfolder);