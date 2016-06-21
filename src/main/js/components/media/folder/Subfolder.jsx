var React = require('react');
var AmpersandMixin = require('ampersand-react-mixin');
var ActionCreator = require('../../../actions/ActionCreator');
var SubfolderView = require('./SubfolderView.jsx');
import {translate} from 'react-i18next';
import SubfolderEdit from './SubfolderEdit.jsx';
import {confirmDeleteFolder, simpleError} from '../../../components/overlay/ConfirmationOverlay';

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
    const {t} = this.props;
    this.onEdit();
    console.log("Folder.changed", folderId, folderName, folderDescription, folderParent);
    ActionCreator.changeFolder(folderId, folderName, folderDescription, folderParent,
      ()=> simpleError(t('error_folder_exists_already')));
  },

  onRemove : function () {
    confirmDeleteFolder(
      this.props.folder.name,
      () => {
        console.log('Folder.onRemove', this.props.folder.getId());
        ActionCreator.removeFolder(this.props.folder.id);
        ActionCreator.closeOverlay();
      },
      () => {
        ActionCreator.closeOverlay();
      }
    );
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