import React, {Component} from "react";
import PropTypes from "prop-types";
import AnnotationPopup from "./AnnotationPopup";
import f from "lodash/fp";
import ActionCreator from "../../actions/ActionCreator";
import {maybe} from "../../helpers/functools";

class TextAnnotationButton extends Component {
  static propTypes = {
    cell: PropTypes.object.isRequired,
    open: PropTypes.bool
  };

  state = {
    node: null
  };

  handleClick = (event) => {
    this.setState({node: event.target});
    const {cell, open} = this.props;
    if (!open) {
      ActionCreator.openAnnotationsPopup(cell);
    } else {
      ActionCreator.closeAnnotationsPopup();
    }
  };

  rememberNode = (node) => {
    if (node) {
      this.setState({node});
    }
  };

  render() {
    const {cell, open} = this.props;
    const annotations = f.flow(
      f.props(["info", "warning", "error"]),
      f.compact,
      f.flatten
    )(cell.annotations);

    const cbr = maybe(this.state.node).exec("getBoundingClientRect").getOrElse({});
    return (
      <div className={`text-annotation-button ${(open) ? "ignore-react-onclickoutside" : ""}`}
           onClick={this.handleClick}
           ref={this.rememberNode}
      >
        <i className="fa fa-commenting" />
        {(open)
          ? <AnnotationPopup nAnnotations={f.size(annotations)}
                             x={cbr.left}
                             y={cbr.top}
                             {...this.props}
          />
          : null
        }
      </div>
    );
  }
}

export default TextAnnotationButton;
