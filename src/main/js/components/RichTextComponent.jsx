/*
 * This component receives a string a input and displays it as markdown.
 * If readOnly is not set, it works as a rich text editor.
 * The saveAndClose function will be called with a markdown string as argument.
 */
import React from "react";
import ReactDOM from "react-dom";
import {markdown} from "markdown";
import toMarkdown from "to-markdown";
import i18n from "i18next";
import classNames from "classnames";
import KeyboardShortcutsHelper from "../helpers/KeyboardShortcutsHelper";
import listensToClickOutside from "react-onclickoutside";

@listensToClickOutside
class RichTextComponent extends React.Component {
  static propTypes = {
    value: React.PropTypes.string.isRequired,
    langtag: React.PropTypes.string.isRequired,
    close: React.PropTypes.func,
    saveAndClose: React.PropTypes.func,
    readOnly: React.PropTypes.bool,
    hideEditorSymbols: React.PropTypes.bool
  };

  constructor(props) {
    super(props);
    if (!props.readOnly && !props.saveAndClose) {
      console.error("RichTextComponent: The has neither received a \"readOnly\" nor a \"saveAndClose\" property. This is probably a mistake");
    }
    this.state = {text: props.value};
  }

  getKeyboardShortcuts = () => {
    return {
      escape: event => {
        event.stopPropagation();
        this.props.close();
        document.getElementById("overlay").focus();
      }
    }
  };

  handleClickOutside = event => {
    const closeHandler = this.props.close || function(){};
    (this.props.readOnly)
      ? closeHandler()
      : this.saveAndClose(event);
  };

  format = (command, param) => () => {
    document.execCommand(command, true, param);
  };

  getValue = () => {
    return ReactDOM.findDOMNode(this.content).innerHTML;
  };

  saveAndClose = event => {
    event.stopPropagation();
    const value = this.getValue();
    const markdown = toMarkdown(value);
    this.props.saveAndClose(markdown);
  };

  componentDidMount = () => {
    const html = markdown.toHTML(this.props.value);
    const contentDOMNode = ReactDOM.findDOMNode(this.content);
    contentDOMNode.innerHTML = html;
  };

  componentWillUnmount = () => {
  };

  render = () => {
    const {hideEditorSymbols,readOnly,close,saveAndClose,onClick} = this.props;
    const clickHandler = onClick || function(){};
    const contentClass = classNames("content-pane", {"input": !readOnly});
    return (
      <div id="rich-text-component" onClick={clickHandler}>
        {(!readOnly && !hideEditorSymbols)
          ? (
            <div className="symbol-bar">
              <div className="action-group">
                <a href="#" onClick={this.format("bold")}><i className="fa fa-bold" /></a>
                <a href="#" onClick={this.format("italic")}><i className="fa fa-italic" /></a>
                <a href="#" onClick={this.format("underline")}><i className="fa fa-underline" /></a>
                <a href="#" onClick={this.format("strikeThrough")}><i className="fa fa-strikethrough" /></a>
              </div>
              <div className="action-group">
                <div className="description">{i18n.t("table:set_header_level")}</div>
                <a href="#" onClick={this.format("formatBlock", "<p>")}><i className="fa fa-ban" /></a>
                <a href="#" onClick={this.format("formatBlock", "<h1>")}><i>1</i></a>
                <a href="#" onClick={this.format("formatBlock", "<h2>")}><i>2</i></a>
                <a href="#" onClick={this.format("formatBlock", "<h3>")}><i>3</i></a>
                <a href="#" onClick={this.format("formatBlock", "<h4>")}><i>4</i></a>
              </div>
              <div className="action-group">
                <a href="#" onClick={this.format("insertunorderedlist")}><i className="fa fa-list-ul" /></a>
                <a href="#" onClick={this.format("insertorderedlist")}><i className="fa fa-list-ol" /></a>
              </div>
            </div>
          )
          : null
        }
        <div className={contentClass}
             contentEditable={!readOnly}
             ref={cp => this.content = cp}
             onKeyDown={KeyboardShortcutsHelper.onKeyboardShortcut(this.getKeyboardShortcuts)}
        >
        </div>
        {(close)
          ? (
            <div className="button-area">
              {(saveAndClose)
                ? (
                <a className="button positive" onClick={this.saveAndClose}>
                {i18n.t("common:save")}
                </a>
                )
                : null}
              <a className="button neutral" onClick={close}>
                {i18n.t("common:cancel")}
              </a>
            </div>

          )
          : null
        }
      </div>
    )
  }
}

export default RichTextComponent;
