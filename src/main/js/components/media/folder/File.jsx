var React = require('react');
var App = require('ampersand-app');
var AmpersandMixin = require('ampersand-react-mixin');

var apiUrl = require('../../../helpers/apiUrl');
var multiLanguage = require('../../../helpers/multiLanguage');
var Dispatcher = require('../../../dispatcher/Dispatcher');
//var ActionCreator = require('../../../actions/ActionCreator');

var FileEdit = require('../overlay/FileEdit.jsx');
var FileEditHead = require('../overlay/FileEditHead.jsx');
var FileEditFooter = require('../overlay/FileEditFooter.jsx');

import ActionCreator from '../../../actions/ActionCreator';
import {isUserAdmin,getUserLanguageAccess} from '../../../helpers/accessManagementHelper';
import {noPermissionAlertWithLanguage, confirmDeleteFile} from '../../../components/overlay/ConfirmationOverlay';


var File = React.createClass({
  mixins : [AmpersandMixin],

  displayName : 'File',

  propTypes : {
    file : React.PropTypes.object.isRequired,
    langtag : React.PropTypes.string.isRequired
  },

  onRemove : function () {
    var fallbackLang = App.langtags[0];
    var retrieveTranslation = multiLanguage.retrieveTranslation(fallbackLang);

    if (isUserAdmin()) {
      confirmDeleteFile(
        retrieveTranslation(this.props.file.title, this.props.langtag),
        ()=> {
          console.log('File.onRemove', this.props.file.uuid);
          ActionCreator.removeFile(this.props.file.uuid);
          ActionCreator.closeOverlay();
        },
        ()=> {
          ActionCreator.closeOverlay();
        });

    } else {
      noPermissionAlertWithLanguage(getUserLanguageAccess());
    }
  },

  onSave : function () {
    Dispatcher.trigger('on-media-overlay-save');
  },

  onCancel : function () {
    Dispatcher.trigger('on-media-overlay-cancel');
  },

  onEdit : function () {
    ActionCreator.openOverlay({
      head : <FileEditHead file={this.props.file} langtag={this.props.langtag}/>,
      body : <FileEdit file={this.props.file} langtag={this.props.langtag} onClose={this.onEditClose}/>,
      footer : <FileEditFooter onSave={this.onSave} onCancel={this.onCancel}/>,
      type : 'full-flex',
      closeOnBackgroundClicked : false
    });
  },

  onEditClose : function (event) {
    ActionCreator.closeOverlay();
  },

  render : function () {
    // default language (for fallback)
    const fallbackLang = App.langtags[0];
    const retrieveTranslation = multiLanguage.retrieveTranslation(fallbackLang);

    // current language
    const langtag = this.props.langtag;
    const title = retrieveTranslation(this.props.file.title, langtag);
    const imageUrl = apiUrl(retrieveTranslation(this.props.file.fileUrl, langtag));

    //delete and edit file
    let mediaOptions = (
      <div className="media-options">
          <span onClick={this.onEdit} className="button" alt="edit">
          <i className="icon fa fa-pencil-square-o"></i>Bearbeiten
        </span>
        <a href={imageUrl} target="_blank" className="button">
          <i className="icon fa fa-external-link"></i>Anzeigen
        </a>
        {isUserAdmin() ? (
          <span className="button" onClick={this.onRemove} alt="delete"><i className="fa fa-trash"></i></span>
        ) : null}
      </div> );

    return (
      <div key={'file' + this.props.file.uuid} className="file">
        <a className="file-link" onClick={this.onEdit} target="_blank">
          <i className="icon fa fa-file"></i><span>{title}</span></a>
        {mediaOptions}
      </div>
    );
  }
});

module.exports = File;
