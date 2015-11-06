var React = require('react');

var multiLanguage = require('../../helpers/multiLanguage');

var FileEdit = React.createClass({

  propTypes : {
    file : React.PropTypes.object.isRequired,
    langtag : React.PropTypes.string.isRequired,
    callback : React.PropTypes.func.isRequired
  },

  saveFile : function (event) {
    event.preventDefault();

    var file = this.props.file;

    file.title[this.props.langtag] = this.refs.fileTitle.getDOMNode().value;
    file.description[this.props.langtag] = this.refs.fileDescription.getDOMNode().value;

    this.props.callback(file);
  },

  renderTextInput : function (id, label, value) {
    if (typeof value === 'undefined') {
      value = "";
    }

    return this.renderField(id, label,
      <input type="text" className="field-text-input" id={id} ref={id} defaultValue={value}/>
    )
  },

  renderField : function (id, label, field) {
    return <div className='form-item'>
      <label htmlFor={id} className="field-label">{label}</label>

      <div className="field-input">
        {field}
      </div>
    </div>
  },

  renderFileEdit : function (file) {
    var retrieveTranslation = multiLanguage.retrieveTranslation();

    return (
      <div className="file-edit">
        <form onSubmit={this.saveFile}>
          {this.renderTextInput("fileTitle", "Title", retrieveTranslation(file.title, this.props.langtag))}
          {this.renderTextInput("fileLinkName", "Link Name", retrieveTranslation(file.externalName, this.props.langtag))}
          {this.renderTextInput("fileDescription", "Description", retrieveTranslation(file.description, this.props.langtag))}
          <div className="form-item">
            <button type="submit" className="form-button">Save</button>
          </div>
        </form>
      </div>
    );
  },

  render : function () {
    return this.renderFileEdit(this.props.file);
  }
});

module.exports = FileEdit;