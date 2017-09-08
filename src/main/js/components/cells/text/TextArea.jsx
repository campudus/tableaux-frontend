import React, {Component} from "react";
import PropTypes from "prop-types";
import Dispatcher from "../../../dispatcher/Dispatcher";
import {ActionTypes} from "../../../constants/TableauxConstants";
import f from "lodash/fp";

class TextArea extends Component {

  static propTypes = {
    initialContent: PropTypes.string,
    onClose: PropTypes.func.isRequired,
    onSave: PropTypes.func.isRequired
  };

  // We save the current text value
  content = null;

  componentDidMount() {
    const {inputArea} = this;
    const text = inputArea.value;
    // Sets cursor to end of input field
    inputArea.value = ""; // textarea must be empty first to jump to end of text
    inputArea.value = text;
  }

  closeOverlayHander = (event) => {
    this.props.onClose(event);
  };

  saveOverlayHander = (event) => {
    this.props.onSave(this.content, event);
  };

  componentWillMount() {
    Dispatcher.on(ActionTypes.OVERLAY_TYPE_TEXT_CLOSE, this.closeOverlayHander);
    Dispatcher.on(ActionTypes.OVERLAY_TYPE_TEXT_SAVE, this.saveOverlayHander);
  }

  componentWillUnmount() {
    Dispatcher.off(ActionTypes.OVERLAY_TYPE_TEXT_CLOSE, this.closeOverlayHander);
    Dispatcher.off(ActionTypes.OVERLAY_TYPE_TEXT_SAVE, this.saveOverlayHander);
  }

  getContent = (event) => {
    return this.inputArea.value;
  };

  onChangeHandler = (event) => {
    this.content = this.getContent(event);
  };

  setInputAreaRef = (node) => {
    this.inputArea = node;
  };

  render() {
    if (f.isNil(this.content)) {
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
                  ref={this.setInputAreaRef}
        />
      </div>
    );
  }
};

export default TextArea;
