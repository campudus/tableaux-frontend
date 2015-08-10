var React = require('react');
var Dispatcher = require('../../Dispatcher');

var FileEdit = React.createClass({

  saveFile : function () {

    var file = this.props.file;

    file.name = this.refs.fileName.getDOMNode().value;
    file.description = this.refs.fileDescription.getDOMNode().value;

    console.log("FileEdit.saveFile", file);
    
    Dispatcher.trigger('add-file', file);
    Dispatcher.trigger('remove-edit-file', file.uuid);
  },

  renderTextInput : function (id, label, value) {
    if (typeof value === 'undefined') {
      value = "";
    }

    return this.renderField(id, label,
      <input type="text" className="form-control" id={id} ref={id} defaultValue={value}/>
    )
  },

  renderField : function (id, label, field) {
    return <div className='field-group'>
      <label htmlFor={id} className="field-label">{label}</label>

      <div className="field-input">
        {field}
      </div>
    </div>
  },

  renderFileEdit : function (file, idx) {
    return (
      <div className="file-edit">
        <div>
          {file.name} ({idx})
        </div>
        {this.renderTextInput("fileName", "Name", file.name)}
        {this.renderTextInput("fileDescription", "Description")}
        <div>
          <button onClick={this.saveFile}>Save</button>
        </div>
      </div>
    );
  },

  render : function () {
    console.log("FileEdit.render", this.props);
    return this.renderFileEdit(this.props.file, this.props.idx);
  }
});

module.exports = FileEdit;