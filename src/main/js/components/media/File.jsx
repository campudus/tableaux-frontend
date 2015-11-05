var React = require('react');
var App = require('ampersand-app');
var AmpersandMixin = require('ampersand-react-mixin');

var apiUrl = require('../../helpers/apiUrl');
var multiLanguage = require('../../helpers/multiLanguage');
var Dispatcher = require('../../dispatcher/Dispatcher');

var FileEdit = require('./FileEdit.jsx');

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
    this.setState({
      edit : !this.state.edit
    });
  },

  onSave : function (file) {
    console.log("File.saveFile", file.uuid, file.title, file.description, file, file.toJSON());
    this.onEdit();
    Dispatcher.trigger('change-file', file.toJSON());
  },

  getInitialState : function () {
    return {
      edit : false
    }
  },

  render : function () {
    // default language (for fallback)
    var retrieveTranslation = multiLanguage.retrieveTranslation(App.langtags[0]);

    // current language
    var langtag = this.props.langtag;

    console.log("File.render", this.props.file.title);

    var title = retrieveTranslation(this.props.file.title, langtag);
    var link = apiUrl(retrieveTranslation(this.props.file.fileUrl, langtag));

    var deleteButton = <span className="button fa fa-remove" onClick={this.onRemove} alt="delete"></span>;

    var classNames = "button fa fa-pencil-square-o";
    if (this.state.edit) {
      classNames += ' active';
    }
    var editButton = <span className={classNames} onClick={this.onEdit} alt="edit"></span>;

    var editForm = "";
    if (this.state.edit) {
      editForm = <FileEdit key={'edit' + this.props.file.uuid} file={this.props.file} callback={this.onSave}
                           langtag={this.props.langtag}/>
    }

    return (
      <div key={'file' + this.props.file.uuid} className="file">
        <a href={link}><span>{title}</span></a>
        {deleteButton}
        {editButton}
        {editForm}
      </div>
    );
  }
});

module.exports = File;
