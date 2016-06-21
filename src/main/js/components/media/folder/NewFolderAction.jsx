var React = require('react');
var NewFolderActionView = require('./NewFolderActionView.jsx');
var SimpleFolder = require('../../../models/media/SimpleFolder');
var ActionCreator = require('../../../actions/ActionCreator');
import SubfolderEdit from './SubfolderEdit';
import {translate} from 'react-i18next';
import listensToClickOutside from 'react-onclickoutside/decorator';
import {simpleError} from '../../../components/overlay/ConfirmationOverlay';


@translate(['media'])
@listensToClickOutside()
class NewFolderAction extends React.Component {

  static propTypes = {
    parentFolder : React.PropTypes.object.isRequired
  };

  constructor(props) {
    console.log("constructor of newfolder action");
    super(props);
    this.state = {
      edit : false
    }
  }

  onEdit = () => {
    console.log("onEdit");
    this.setState({
      edit : !this.state.edit
    });
  };

  onSave = (folderId, folderName, folderDescription, folderParent) => {
    const {t} = this.props;
    this.onEdit();
    console.log("Folder.added", folderId, folderName, folderDescription, folderParent);
    ActionCreator.addFolder(folderName, folderDescription, folderParent,
      () => simpleError(t('error_folder_exists_already')));
  };

  render() {
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
}

export default NewFolderAction;