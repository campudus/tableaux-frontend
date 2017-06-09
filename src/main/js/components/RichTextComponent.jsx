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
import listensToClickOutside from "react-onclickoutside";
import * as f from "lodash/fp";

@listensToClickOutside
class RichTextComponent extends React.Component {
  static propTypes = {
    value: React.PropTypes.string.isRequired,
    langtag: React.PropTypes.string.isRequired,
    close: React.PropTypes.func,
    saveAndClose: React.PropTypes.func,
    readOnly: React.PropTypes.bool,
    hideEditorSymbols: React.PropTypes.bool,
    handleContent: React.PropTypes.func
  };

  constructor(props) {
    super(props);
    if ((!!props.readOnly ^ !!props.saveAndClose) !== 1) {
      console.error("RichTextComponent: Component should receive either a \"readOnly\" XOR a \"saveAndClose\" property.");
    }
  }

  shouldComponentUpdate(nextProps) {
    if (this.props.value !== nextProps.value) { // needed as we set HTML content manually
      this.resetValue(nextProps.value);
    }
    return true;
  }

  getKeyboardShortcuts = () => {
    return {
      escape: event => {
        event.stopPropagation();
        this.props.close();
      }
    };
  };

  handleClickOutside = event => {
    const closeHandler = this.props.close || function () {};
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
    this.props.saveAndClose(this.getMarkdown());
  };

  componentDidMount = () => {
    this.resetValue();
  };

  resetValue = (value) => {
    const valueToSet = value || this.props.value;
    const html = markdown.toHTML(valueToSet);
    const contentDOMNode = ReactDOM.findDOMNode(this.content);
    contentDOMNode.innerHTML = html;
    contentDOMNode.focus();
  };

  componentWillUnmount = () => {
  };

  getMarkdown = inValue => {
    const value = inValue || this.getValue();
    const markdown = toMarkdown(value);
    const allTags = new RegExp(/<.*?>/, "g");
    return markdown.replace(allTags, "");
  };

  handleInput = event => {
    if (f.contains(f.get("key", event), ["Enter", "ArrowUp", "ArrowDown"])) {
      event.stopPropagation();
    }
  };

  handleChange = event => {
    if (f.get("target", event)) {
      const {handleContent} = this.props;
      if (handleContent) {
        handleContent(this.getMarkdown(event.target.value));
      }
    }
  };

  render = () => {
    const {hideEditorSymbols, readOnly, onClick, tabIdx} = this.props;
    const clickHandler = onClick || function () {};
    const contentClass = classNames("content-pane", {"input": !readOnly});
    const cssClass = classNames("rich-text-component", {"editing": !readOnly, "preview": readOnly});
    return (
        <div className={cssClass} onClick={clickHandler} tabIndex={tabIdx} onKeyDown={this.handleInput} >
        {(!readOnly && !hideEditorSymbols)
          ? (
            <div className="symbol-bar">
              <div className="action-group">
                <a href="#" onClick={this.format("removeFormat")}><i className="fa fa-times"/></a>
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
             ref={cp => { this.content = cp; }}
             onChange={evt => (readOnly) ? f.noop : this.handleChange(evt)}
        >
        </div>
      </div>
    );
  }
}

export default RichTextComponent;
