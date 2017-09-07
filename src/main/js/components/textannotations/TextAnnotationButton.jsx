import React, {PropTypes, Component} from "react";
import AnnotationPopup from "./AnnotationPopup";
import f from "lodash/fp";
import ActionCreator from "../../actions/ActionCreator";
import connectToAmpersand from "../helperComponents/connectToAmpersand";

@connectToAmpersand
export default class TextAnnotationButton extends Component {
  static PropTypes = {
    row: PropTypes.object.isRequired,
    cell: PropTypes.object.isRequired,
    langtag: PropTypes.string.isRequired,
    open: PropTypes.bool
  };

  constructor(props) {
    super(props);
    props.watch(props.cell, {events: "annotations:change"});
  }

  handleClick = (event) => {
    const {cell, open} = this.props;
    if (!open) {
      ActionCreator.openAnnotationsPopup(cell);
    } else {
      ActionCreator.closeAnnotationsPopup();
    }
  };

  render() {
    const {cell, open} = this.props;
    const annotations = f.compose(
      f.flatten,
      f.compact,
      f.props(["info", "warning", "error"])
    )(cell.annotations);
    return (
      <div className={`text-annotation-button ${(open) ? "ignore-react-onclickoutside" : ""}`}
           onClick={this.handleClick}
      >
        <i className="fa fa-commenting" />
        {(open)
          ? <AnnotationPopup nAnnotations={f.size(annotations)}
                             {...this.props}
          />
          : null
        }
      </div>
    );
  }
}
