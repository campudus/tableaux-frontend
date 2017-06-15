import React from "react";
import _ from "lodash";
import Dispatcher from "../../../dispatcher/Dispatcher";
import {ActionTypes} from "../../../constants/TableauxConstants";

const TextArea = React.createClass({

  propTypes: {
    initialContent: React.PropTypes.string,
    onClose: React.PropTypes.func.isRequired,
    onSave: React.PropTypes.func.isRequired
  },

  // We save the current text value
  content: null,

  componentDidMount: function () {
    const inputArea = this.refs.inputArea;
    const text = inputArea.value;
    // Sets cursor to end of input field
    inputArea.value = ""; // textarea must be empty first to jump to end of text
    inputArea.value = text;
  },

  closeOverlayHander: function (event) {
    this.props.onClose(event);
  },

  saveOverlayHander: function (event) {
    this.props.onSave(this.content, event);
  },

  componentWillMount: function () {
    Dispatcher.on(ActionTypes.OVERLAY_TYPE_TEXT_CLOSE, this.closeOverlayHander);
    Dispatcher.on(ActionTypes.OVERLAY_TYPE_TEXT_SAVE, this.saveOverlayHander);
  },

  componentWillUnmount: function () {
    Dispatcher.off(ActionTypes.OVERLAY_TYPE_TEXT_CLOSE, this.closeOverlayHander);
    Dispatcher.off(ActionTypes.OVERLAY_TYPE_TEXT_SAVE, this.saveOverlayHander);
  },

  getContent: function (event) {
    return this.refs.inputArea.value;
  },

  onChangeHandler: function (event) {
    this.content = this.getContent(event);
  },

  render: function () {
    if (_.isNil(this.content)) {
      this.content = this.props.initialContent;
    }
    // TODO change to new refs handling
    return (
      <div>
        <textarea autoFocus
                  className="input text-editor"
                  type="text"
                  defaultValue={this.content}
                  onChange={this.onChangeHandler}
                  ref="inputArea"></textarea>
      </div>
    );
  }
});

export default TextArea;
