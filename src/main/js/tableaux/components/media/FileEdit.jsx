var React = require('react');
var Dispatcher = require('../../Dispatcher');

var FileEdit = React.createClass({

  saveFile : function (event) {
    event.preventDefault();

    var file = this.props.file;

    file.name = this.refs.fileName.getDOMNode().value;
    file.description = this.refs.fileDescription.getDOMNode().value;

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
    return (
      <div className="file-edit">
        <form onSubmit={this.saveFile}>
          {this.renderTextInput("fileName", "Name", file.name)}
          {this.renderTextInput("fileDescription", "Description", file.description)}
          <div className="form-item">
            <button type="submit" className="form-button">Save</button>
          </div>
        </form>
      </div>
    );
  },

  render : function () {
    console.log("FileEdit.render", this.props);
    return this.renderFileEdit(this.props.file);
  }
});

module.exports = FileEdit;