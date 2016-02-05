var React = require('react');
var Dispatcher = require('../../../dispatcher/Dispatcher');
var ActionTypes = require('../../../constants/TableauxConstants').ActionTypes;

var TextArea = React.createClass({

  propTypes : {
    initialContent : React.PropTypes.string,
    onClose : React.PropTypes.func.isRequired,
    onSave : React.PropTypes.func.isRequired
  },

  //We save the current text value
  content: null,

  componentDidMount : function () {
    var inputArea = this.refs.inputArea;
    var text = inputArea.value;
    // Sets cursor to end of input field
    inputArea.value = ""; //textarea must be empty first to jump to end of text
    inputArea.value = text;
  },

  closeOverlayHander : function (event) {
    this.props.onClose(event);
  },

  saveOverlayHander : function (event) {
    this.props.onSave(this.content, event);
  },

  componentWillMount : function () {
    Dispatcher.on(ActionTypes.OVERLAY_TYPE_TEXT_CLOSE, this.closeOverlayHander);
    Dispatcher.on(ActionTypes.OVERLAY_TYPE_TEXT_SAVE, this.saveOverlayHander);
  },

  componentWillUnmount : function () {
    Dispatcher.off(ActionTypes.OVERLAY_TYPE_TEXT_CLOSE, this.closeOverlayHander);
    Dispatcher.off(ActionTypes.OVERLAY_TYPE_TEXT_SAVE, this.saveOverlayHander);
  },

  getContent : function (event) {
    return this.refs.inputArea.value;
  },

  onChangeHandler : function (event) {
    this.content = this.getContent(event);
  },

  render : function () {
    if (_.isNil(this.content)) {
      this.content = this.props.initialContent;
    }
    return (
      <div>
        <textarea autoFocus className="input text-editor" type="text" defaultValue={this.content} onChange={this.onChangeHandler} ref="inputArea"></textarea>
      </div>
    );
  }
});

module.exports = TextArea;