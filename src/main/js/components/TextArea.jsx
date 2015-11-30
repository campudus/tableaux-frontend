var React = require('react');
var TinyMCE = require('react-tinymce');

var TextArea = React.createClass({

  displayName : 'TextArea',

  propTypes : {
    initialContent : React.PropTypes.string,

    onClose : React.PropTypes.func.isRequired,
    onSave : React.PropTypes.func.isRequired,
    onChange : React.PropTypes.func
  },

  getInitialState : function (event) {
    return {
      richEditor : false
    }
  },

  getContent : function (event) {
    return this.state.richEditor ? event.target.getContent() : this.refs.input.value
  },

  _onClose : function (event) {
    this.props.onClose(event)
  },

  _onChange : function (event) {
    var newContent = this.getContent(event);

    this.content = newContent;

    if (typeof this.props.onChange === "function") {
      this.props.onChange(newContent, event)
    }
  },

  _onSave : function (event) {
    this.props.onSave(this.content, event);
  },

  toggleRichEditor : function () {
    this.setState({richEditor : !this.state.richEditor})
  },

  renderRichEditor : function (content) {
    var config = {
      plugins : 'autolink link image lists print code insertdatetime',
      toolbar : 'undo redo | bold | alignleft aligncenter alignright',
      resize : false,
      height : '100%'
    };

    return (
      <TinyMCE
        content={content}
        config={config}
        onChange={this._onChange}
        />
    );
  },

  render : function () {
    var editor = "";

    if (typeof this.content === 'undefined') {
      this.content = this.props.initialContent;
    }

    if (this.state.richEditor) {
      editor = this.renderRichEditor(this.content);
    } else {
      editor = (
        <textarea className="input" type="text" defaultValue={this.content} ref="input"
                  onChange={this._onChange}></textarea>
      )
    }

    return (
      <div>
        {editor}

        <button onClick={this._onSave} className="button">Save &amp; Close</button>
        <button onClick={this._onClose} className="button">Cancel &amp; Close</button>
        <button onClick={this.toggleRichEditor}
                className="button">{this.state.richEditor ? "Disable editor" : "Enable editor"}</button>
      </div>
    );
  }
});

module.exports = TextArea;