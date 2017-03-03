/*
 * This component receives a string as input, interprets it as markdown, and displays it as HTML.
 * If readOnly is not set, it works as a simple rich text editor.
 * The saveAndClose function will receive the visible content converted to markdown as argument.
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
    if (props.readOnly ^ props.saveAndClose !== 1) {
      console.error("RichTextComponent: Component should receive either a \"readOnly\" XOR a \"saveAndClose\" property.");
    }
  }

  getKeyboardShortcuts = () => {
    return {
      escape: event => {
        event.stopPropagation();
        this.props.close();
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
    const allTags = new RegExp(/<.*?>/, "g");
    const cleanedMarkdown = markdown.replace(allTags, "");
    this.props.saveAndClose(cleanedMarkdown);
  };

  componentDidMount = () => {
    const html = markdown.toHTML(this.props.value);
    const contentDOMNode = ReactDOM.findDOMNode(this.content);
    contentDOMNode.innerHTML = html;
    contentDOMNode.focus();
  };

  componentWillUnmount = () => {
  };

  activateOnEnter = event => {
    if (event && this.props.onClick && event.key === "Enter") {
      event.preventDefault();
      event.stopPropagation();
      this.props.onClick(event);
    }
  };

  render = () => {
    const {hideEditorSymbols,readOnly,close,saveAndClose,onClick,tabIdx} = this.props;
    const clickHandler = onClick || function(){};
    const contentClass = classNames("content-pane", {"input": !readOnly});
    return (
      <div id="rich-text-component" onClick={clickHandler} tabIndex={tabIdx} onKeyDown={this.activateOnEnter}>
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
