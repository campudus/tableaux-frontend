var React = require('react');
var App = require('ampersand-app');
var AmpersandMixin = require('ampersand-react-mixin');

var apiUrl = require('../../helpers/apiUrl');
var multiLanguage = require('../../helpers/multiLanguage');
var Dispatcher = require('../../dispatcher/Dispatcher');

var SingleFileEdit = require('./SingleFileEdit.jsx');
var FileEditHead = require('./FileEditHead.jsx');

var File = React.createClass({
  mixins : [AmpersandMixin],

  displayName : 'File',

  propTypes : {
    file : React.PropTypes.object.isRequired,
    langtag : React.PropTypes.string.isRequired
  },

  onRemove : function () {
    console.log('File.onRemove', this.props.file.uuid);

    this.props.file.destroy({
      success : function () {
        console.log('File was deleted.');
      },
      error : function () {
        console.log('There was an error deleting the file.');
      }
    });
  },

  onEdit : function () {
    var self = this;
    var file = this.props.file;
    var overlayBody;
    if(file.internalName && file.internalName.length > 1) {
      overlayBody = <div>mf</div>;
    } else {
      overlayBody = <SingleFileEdit file={this.props.file} langtag={this.props.langtag} onClose={self.onEditClose}/>;
    }

    Dispatcher.trigger('open-overlay', {
      head : <FileEditHead file={this.props.file} langtag={this.props.langtag}/>,
      body : overlayBody,
      type : 'full',
      closeOnBackgroundClicked : false
    });
  },

  onEditClose : function (event) {
    Dispatcher.trigger('close-overlay');
  },

  render : function () {
    // default language (for fallback)
    var fallbackLang = App.langtags[0];
    if (this.props.file.title.zxx_ZXX) {
      fallbackLang = "zxx_ZXX";
    }
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
        <a href={link}><i className="icon fa fa-file"></i><span>{title}</span></a>
        {deleteButton}
        {editButton}
      </div>
    );
  }
});

module.exports = File;
