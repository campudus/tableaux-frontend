import React, {Component} from "react";
import PropTypes from "prop-types";
import AnnotationPopup from "./AnnotationPopup";
import f from "lodash/fp";
import ActionCreator from "../../actions/ActionCreator";
import connectToAmpersand from "../helperComponents/connectToAmpersand";
import {maybe} from "../../helpers/functools";

@connectToAmpersand
class TextAnnotationButton extends Component {
  static PropTypes = {
    cell: PropTypes.object.isRequired,
    open: PropTypes.bool
  };

  constructor(props) {
    super(props);
    props.watch(props.cell, {events: "annotations:change"});
  }

  state = {
    cbr: {}
  };

  handleClick = (event) => {
    const {cell, open} = this.props;
    if (!open) {
      ActionCreator.openAnnotationsPopup(cell);
    } else {
      ActionCreator.closeAnnotationsPopup();
    }
  };

  rememberNode = (node) => {
    const cbr = maybe(node)
      .exec("getBoundingClientRect")
      .getOrElse({});
    this.setState({cbr});
  };

  render() {
    const {cell, open} = this.props;
    const annotations = f.flow(
      f.props(["info", "warning", "error"]),
      f.compact,
      f.flatten
    )(cell.annotations);
    return (
      <div className={`text-annotation-button ${(open) ? "ignore-react-onclickoutside" : ""}`}
        onClick={this.handleClick}
        ref={this.rememberNode}
      >
        <i className="fa fa-commenting" />
        {(open)
          ? <AnnotationPopup nAnnotations={f.size(annotations)}
            x={this.state.cbr.left}
            y={this.state.cbr.top}
            {...this.props}
          />
          : null
        }
      </div>
    );
  }
}

export default TextAnnotationButton;
