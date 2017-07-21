/*
 * This component receives a string as input, interprets it as markdown, and displays it as HTML.
 * If readOnly is not set, it works as a simple rich text editor.
 * The saveAndClose function will receive the visible content converted to markdown as argument.
 */
import React, {Component, PropTypes} from "react";
import ReactDOM from "react-dom";
import {markdown} from "markdown";
import toMarkdown from "to-markdown";
import i18n from "i18next";
import classNames from "classnames";
import listensToClickOutside from "react-onclickoutside";
import * as f from "lodash/fp";

import TextView from "./entityView/text/TextView";

@listensToClickOutside
class RichTextComponent extends Component {
  static propTypes = {
    value: PropTypes.string.isRequired,
    langtag: PropTypes.string.isRequired,
    close: PropTypes.func,
    saveAndClose: PropTypes.func,
    readOnly: PropTypes.bool,
    handleContent: PropTypes.func,
    hideEditorSymbols: PropTypes.bool,
    placeholder: PropTypes.element
  };

  constructor(props) {
    super(props);
    if ((!!props.readOnly ^ !!props.saveAndClose) !== 1) {
      console.error("RichTextComponent: Component should receive either a \"readOnly\" XOR a \"saveAndClose\" property.");
    }
    this.state = {focused: false};
  }

  componentWillReceiveProps = (nextProps) => {
    if (this.props.value !== nextProps.value) { // needed as we set HTML content manually
      this.resetValue(nextProps.value);
    }
  };

  getKeyboardShortcuts = () => {
    return {
      escape: event => {
        event.stopPropagation();
        this.props.saveAndClose();
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
    this.props.saveAndClose(this.toCellValue());
  };

  componentDidMount = () => {
    this.resetValue(this.props.value);
  };

  resetValue = (value) => {
    const valueToSet = value || "";
    const contentDOMNode = ReactDOM.findDOMNode(this.content);
    if (!this.props.hideEditorSymbols) {
      const html = markdown.toHTML(valueToSet);
      contentDOMNode.innerHTML = html;
    } else {
      contentDOMNode.innerText = value;
    }
    this.positionCaret(contentDOMNode);
  };

  positionCaret = (domNode) => {
    if (!domNode) {
      return;
    }

    const lastEntry = domNode.lastChild || domNode;
    const range = document.createRange();
    try {
      range.setStart(lastEntry, 1);
      range.setEnd(lastEntry, 1);

      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
      lastEntry.focus();
    } catch (e) {
      // Text is empty, so can't set caret
    }
  };

  componentWillUnmount = () => {
    if (this.props.saveAndClose) {
      this.props.saveAndClose(this.toCellValue());
    }
  };

  toCellValue = (inValue) => {
    const value = inValue || this.getValue();
    const allTags = /<.*?>/g;
    if (!this.props.hideEditorSymbols) {
      const escaped = new Map([
        []
      ]);

      const markdown = toMarkdown(value);
      return markdown.replace(allTags, "");
    } else {
      const withTextLineBreaks = value.replace(/<br>|<\/div><div>|<div>/g, "\n");
      const withoutHtml = withTextLineBreaks.replace(allTags, "");
      return withoutHtml.trim();
    }
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
        handleContent(this.toCellValue(event.target.value));
      }
    }
  };

  render = () => {
    const {hideEditorSymbols, readOnly, onClick, tabIdx, placeholder} = this.props;
    const clickHandler = onClick || function () {};
    const contentClass = classNames("content-pane", {"input": !readOnly});
    const cssClass = classNames("rich-text-component", {"editing": !readOnly, "preview": readOnly});

    const contentEmpty = !this.content
      || this.content && f.isEmpty(this.content.textContent) && f.isEmpty(this.content.children);

    return (
      <div className="rich-text-wrapper">
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
          {(contentEmpty && !this.state.focused)
            ? <div onClick={() => { this.content && this.content.focus(); }}>{placeholder}</div>
            : null}
          <div className={contentClass}
               contentEditable={!readOnly}
               ref={cp => { this.content = cp; }}
               onChange={evt => (readOnly) ? f.noop : this.handleChange(evt)}
               onKeyDown={this.handleKeyPress}
               onFocus={() => this.setState({focused: true})}
               onBlur={() => this.setState({focused: false})}
          />
        </div>
      </div>
    );
  }
}

// export default RichTextComponent;
export default TextView;
