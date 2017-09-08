import React, {PureComponent} from "react";
import PropTypes from "prop-types";
import listenToClickOutside from "react-onclickoutside";
import f from "lodash/fp";
import {DefaultLangtag} from "../../constants/TableauxConstants";
import Empty from "../helperComponents/emptyEntry";
import AnnotationEntry from "./AnnotationEntry";
import {setCellAnnotation} from "../../helpers/annotationHelper";
import i18n from "i18next";
import ActionCreator from "../../actions/ActionCreator";
import SvgIcon from "../helperComponents/SvgIcon";
import classNames from "classnames";
import Portal from "react-portal";

@listenToClickOutside
class AnnotationPopup extends PureComponent {
  static PropTypes = {
    row: PropTypes.object.isRequired,
    cell: PropTypes.object.isRequired,
    langtag: PropTypes.string.isRequired,
    x: PropTypes.number.isRequired,
    y: PropTypes.number.isRequired
  };

  constructor(props) {
    super(props);
    this.state = {
      comment: "",
      needsLeftShift: false
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
  };

  render() {
    const {cell, cell: {row}, langtag} = this.props;
    const annotations = f.compose(
      f.sortBy("createdAt"),
      f.compact,
      f.flatten,
      f.props(["info", "warning", "error"])
    )(cell.annotations);
    const rowConcatObj = row.cells.at(0).displayValue;
    const rowConcat = rowConcatObj[langtag] || rowConcatObj[DefaultLangtag];

    const popupCssClass = classNames("annotation-popup", {
      "shift-left": this.state.needsLeftShift,
      "in-first-row": row.id === cell.tables.get(cell.tableId).rows.at(0).id
    });

    return (
      <Portal isOpened >
        <div className={popupCssClass}
          onClick={this.handleClick}
          onContextMenu={this.handleClick}
          style={{
            "left": `${this.props.x - 5}px`,
            "top": `${this.props.y - 16}px`
          }}
        >
          <div className="close-icon"
            onClick={ActionCreator.closeAnnotationsPopup}
          >
            <SvgIcon icon="cross"/>
          </div>
          <div className="annotation-popup-header" ref={node => { this.header = node; }}>
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
          <footer ref={node => { this.footer = node; }}
            tabIndex="1"
          >
            <input type="text"
              onChange={this.handleInputChange}
              autoFocus
              placeholder={i18n.t("table:new-comment")}
              onKeyDown={this.handleInputKeys}
              value={this.state.comment}
            />
            <div className="button"
              onClick={this.saveComment}
            >
              {i18n.t("common:add")}
            </div>
          </footer>
        </div>
      </Portal>
    );
  }
}

export default AnnotationPopup;
