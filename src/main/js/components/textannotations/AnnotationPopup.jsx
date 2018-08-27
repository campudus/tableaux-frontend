import React, {PureComponent} from "react";
import PropTypes from "prop-types";
import listenToClickOutside from "react-onclickoutside";
import f from "lodash/fp";
import _ from "lodash";
import {DefaultLangtag} from "../../constants/TableauxConstants";
import Empty from "../helperComponents/emptyEntry";
import AnnotationEntry from "./AnnotationEntry";
import {setCellAnnotation} from "../../helpers/annotationHelper";
import i18n from "i18next";
import ActionCreator from "../../actions/ActionCreator";
import SvgIcon from "../helperComponents/SvgIcon";
import classNames from "classnames";
import {Portal} from "react-portal";
import {doto, either, maybe} from "../../helpers/functools";
import FocusTrap from "focus-trap-react";

@listenToClickOutside
class AnnotationPopup extends PureComponent {
  static propTypes = {
    cell: PropTypes.object.isRequired,
    x: PropTypes.number,
    y: PropTypes.number
  };

  constructor(props) {
    super(props);
    this.state = {
      comment: "",
      input: null,
      container: null
    };
  };

  saveComment = () => {
    const {comment} = this.state;
    if (f.isEmpty(comment)) {
      return;
    }
    const annotation = {
      type: "info",
      value: comment
    };

    setCellAnnotation(annotation, this.props.cell);
    this.setState({comment: ""});
    maybe(this.state.input).exec("focus");
  };

  handleClickOutside = () => {
    ActionCreator.closeAnnotationsPopup();
  };

  handleInputChange = (evt) => {
    this.setState({comment: evt.target.value});
  };

  handleInputKeys = (evt) => {
    evt.stopPropagation();
    if (evt.key === "Escape") {
      if (f.isEmpty(this.state.comment)) {
        ActionCreator.closeAnnotationsPopup();
      } else {
        this.setState({comment: ""});
      }
    } else if (evt.key === "Enter") {
      this.saveComment();
    }
  };

  handleClick = (event) => {
    event.stopPropagation();
    this.focusInput();
  };

  rememberInput = (node) => {
    maybe(node).method("focus");
    this.setState({input: node});
  };

  rememberContainer = (node) => {
    this.setState({container: node});
  };

  focusInput = () => {
    maybe(this.state.input).method("focus");
  };

  componentDidUpdate(prevProps) {
    const {y = 0} = this.props;
    const rect = maybe(this.state.container).exec("getBoundingClientRect").getOrElse({bottom: 0, height: 0});
    const oldHeight = f.getOr(0, ["cbr", "height"], this.state);
    const needsShiftUp = y - 16 + rect.height >= window.innerHeight;
    if (this.state.needsShiftUp !== needsShiftUp || rect.height !== oldHeight) {
      this.setState({
        needsShiftUp,
        cbr: rect
      });
    }
  }

  setArrowPosition = (fromBottom = 0) => {
    const arrowSelector = ".annotation-popup.shift-up::before";
    // The first element doesn't have the key "cssRules", leading to an error.
    const sheets = _.tail(document.styleSheets);

    const arrowRule = doto(sheets,
      f.map("cssRules"),
      f.map(f.find(f.matchesProperty("selectorText", arrowSelector))),
      f.flatten,
      f.compact,
      f.first
    );

    either(arrowRule)
      .map(
        (rule) => {
          rule.style.bottom = (fromBottom - 15) + "px";
          return true;
        }
      )
      .orElse(
        () => console.error("The CSS selector for the annoations popup seems to have changed; adapt " +
          "the arrowSelector constant in AnnotationPopup.jsx accordingly!"
        )
      );
  };

  render() {
    this.focusInput();
    const {cell, cell: {row}, langtag, x = 0, y = 0} = this.props;
    const annotations = f.flow(
      f.props(["info", "warning", "error"]),
      f.flatten,
      f.compact,
      f.sortBy("createdAt")
    )(cell.annotations);
    const rowConcatObj = row.cells.at(0).displayValue;
    const rowConcat = rowConcatObj[langtag] || rowConcatObj[DefaultLangtag];

    const rect = maybe(this.state.container).exec("getBoundingClientRect").getOrElse({bottom: 0, height: 0});
    const {needsShiftUp} = this.state;
    const top = (needsShiftUp)
      ? Math.max(y + 24 - rect.height, 110)
      : y - 16;

    if (needsShiftUp) {
      this.setArrowPosition(top + rect.height - y);
    }

    const popupCssClass = classNames("annotation-popup ignore-react-onclickoutside", {
      "shift-up": needsShiftUp,
      "in-first-row": row.id === cell.tables.get(cell.tableId).rows.at(0).id
    });

    return (
      <Portal isOpened >
        <FocusTrap>
        <div className="disable-scrolling"
             style={{left: 0, right: 0, top: "90px", bottom: 0, zIndex: 1, position: "fixed"}}
        />
          <div className={popupCssClass}
               ref={this.rememberContainer}
               onClick={this.handleClick}
               onContextMenu={this.handleClick}
               style={{
                 "left": `${x - 5}px`,
                 top
               }}
          >
            <div className="close-icon"
                 onClick={ActionCreator.closeAnnotationsPopup}
            >
              <SvgIcon icon="cross"/>
            </div>
            <div className="annotation-popup-header">
              <div className="annotation-header-title">
                <i className="fa fa-commenting" />
                {i18n.t("table:cell-comments")}
              </div>
              {(rowConcat)
                ? <div className="annotation-label">{rowConcat}</div>
                : <Empty/>
              }
            </div>
            <div className="annotation-popup-list">
              {f.reverse(annotations).map(
                (ann, idx) => (
                  <AnnotationEntry annotation={ann}
                                   key={ann.uuid}
                                   cell={cell}
                                   idx={f.size(annotations) - idx}
                  />
                )
              )}
            </div>
            <footer tabIndex="1">
              <input type="text"
                     ref={this.rememberInput}
                     onChange={this.handleInputChange}
                     autoFocus
                     placeholder={i18n.t("table:new-comment")}
                     onKeyDown={this.handleInputKeys}
                     value={this.state.comment}
                     onBlur={this.focusInput}
              />
              <div className="button"
                   onClick={this.saveComment}
              >
                {i18n.t("common:add")}
              </div>
            </footer>
          </div>
        </FocusTrap>
      </Portal>
    );
  }
}

export default AnnotationPopup;
