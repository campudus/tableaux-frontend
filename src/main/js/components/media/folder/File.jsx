var React = require('react');
var App = require('ampersand-app');
var AmpersandMixin = require('ampersand-react-mixin');

var apiUrl = require('../../../helpers/apiUrl');
var multiLanguage = require('../../../helpers/multiLanguage');
var Dispatcher = require('../../../dispatcher/Dispatcher');
var ActionCreator = require('../../../actions/ActionCreator');

var FileEdit = require('../overlay/FileEdit.jsx');
var FileEditHead = require('../overlay/FileEditHead.jsx');
var FileEditFooter = require('../overlay/FileEditFooter.jsx');

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

    if (confirm("Soll die Datei '" + retrieveTranslation(this.props.file.title, this.props.langtag) + "' wirklich gelöscht werden? Dies kann nicht rückgängig gemacht werden!")) {
      console.log('File.onRemove', this.props.file.uuid);
      ActionCreator.removeFile(this.props.file.uuid);
    }
  },

  onSave : function () {
    Dispatcher.trigger('on-media-overlay-save');
  },

  onCancel : function () {
    Dispatcher.trigger('on-media-overlay-cancel');
  },

  onEdit : function () {
    Dispatcher.trigger('open-overlay', {
      head : <FileEditHead file={this.props.file} langtag={this.props.langtag}/>,
      body : <FileEdit file={this.props.file} langtag={this.props.langtag} onClose={this.onEditClose}/>,
      footer : <FileEditFooter onSave={this.onSave} onCancel={this.onCancel}/>,
      type : 'full-flex',
      closeOnBackgroundClicked : false
    });
  },

  onEditClose : function (event) {
    Dispatcher.trigger('close-overlay');
  },

  render : function () {
    // default language (for fallback)
    var fallbackLang = App.langtags[0];
    var retrieveTranslation = multiLanguage.retrieveTranslation(fallbackLang);

    // current language
    var langtag = this.props.langtag;

    var title = retrieveTranslation(this.props.file.title, langtag);
    var link = apiUrl(retrieveTranslation(this.props.file.fileUrl, langtag));

    var deleteButton = <span className="button fa fa-remove" onClick={this.onRemove} alt="delete"></span>;

    var classNames = "button fa fa-pencil-square-o";
    var editButton = <span className={classNames} onClick={this.onEdit} alt="edit"></span>;

    return (
      <div key={'file' + this.props.file.uuid} className="file">
        <a href={link} target="_blank"><i className="icon fa fa-file"></i><span>{title}</span></a>
        {deleteButton}
        {editButton}
      </div>
    );
  }
});

module.exports = File;
