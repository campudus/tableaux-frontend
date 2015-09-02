var React = require('react');
var apiUrl = require('../../apiUrl');
var AmpersandMixin = require('ampersand-react-mixin');
var FileEdit = require('./FileEdit.jsx');
var Dispatcher = require('../../Dispatcher');

var File = React.createClass({
  mixins : [AmpersandMixin],

  displayName : 'File',

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

  onSave : function (newFile) {
    console.log("File.saveFile", newFile.uuid, newFile.name, newFile.description, newFile, newFile.toJSON());
    this.onEdit();
    Dispatcher.trigger('add-file', newFile.toJSON());
  },

  getInitialState : function () {
    return {
      edit : false
    }
  },

  render : function () {
    var name = this.props.file.name;
    var link = apiUrl(this.props.file.fileUrl);

    var deleteButton = <span className="button fa fa-remove" onClick={this.onRemove} alt="delete"></span>;

    var classNames = "button fa fa-pencil-square-o";
    if (this.state.edit) {
      classNames += ' active';
    }
    var editButton = <span className={classNames} onClick={this.onEdit} alt="edit"></span>;

    var editForm = "";
    if (this.state.edit) {
      editForm = <FileEdit key={'edit' + this.props.file.uuid} file={this.props.file} callback={this.onSave}/>
    }

    return (
      <div key={'file' + this.props.file.uuid} className="file">
        <a href={link}><span>{name}</span></a>
        {deleteButton}
        {editButton}
        {editForm}
      </div>
    );
  }
});

module.exports = File;
