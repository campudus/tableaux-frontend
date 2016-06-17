var React = require('react');
var AmpersandMixin = require('ampersand-react-mixin');
var ActionCreator = require('../../../actions/ActionCreator');
import {isUserAdmin} from '../../../helpers/accessManagementHelper';
import {translate} from 'react-i18next';

var SubfolderView = React.createClass({
  mixins : [AmpersandMixin],

  propTypes : {
    folder : React.PropTypes.object.isRequired,
    langtag : React.PropTypes.string.isRequired,
    onRemove : React.PropTypes.func.isRequired,
    onEdit : React.PropTypes.func.isRequired
  },

  folderClickHandler : function (event) {
    event.preventDefault();
    ActionCreator.switchFolder(this.props.folder.id, this.props.langtag);
  },

  render : function () {
    const name = this.props.folder.name;
    const {t} = this.props;
    const mediaOptions = isUserAdmin() ? (
      <div className="media-options">
          <span className="button" onClick={this.props.onEdit} alt="edit">
          <i className="icon fa fa-pencil-square-o"></i>{t('rename_folder')}
        </span>
        <span className="button" onClick={this.props.onRemove} alt={t('delete_folder')}>
          <i className="fa fa-trash"></i>
        </span>
      </div>
    ) : null;

    return (
      <div>
        <a className="folder-link" onClick={this.folderClickHandler}>
          <i className="icon fa fa-folder-open"></i><span>{name}</span>
        </a>
        {mediaOptions}
      </div>
    );
  }
});

module.exports = translate(['media'])(SubfolderView);
