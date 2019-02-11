import React, {PureComponent} from "react";
import PropTypes from "prop-types";
import {deleteCellAnnotation} from "../../helpers/annotationHelper";
import {DateTimeFormats} from "../../constants/TableauxConstants";
import Moment from "moment";
import f from "lodash/fp";

const FADE_OUT_TIME = 200; // milliseconds

export default class AnnotationEntry extends PureComponent {
  static propTypes = {
    annotation: PropTypes.object.isRequired,
    cell: PropTypes.object.isRequired,
    idx: PropTypes.number.isRequired
  };

  constructor(props) {
    super(props);
    this.state = {
      confirmed: false
    };
  }

  confirm = () => {
    const {cell, annotation} = this.props;
    this.setState(
      {confirmed: true},
      () => setTimeout(() => deleteCellAnnotation(annotation, cell, true), FADE_OUT_TIME)
    );
  };

  render() {
    const {annotation} = this.props;
    const {confirmed} = this.state;
    const style = (confirmed)
      ? {
        "transition": `transform ${FADE_OUT_TIME}ms`,
        "transform": "scale(0)"
      }
      : {
        "transition": `transform ${FADE_OUT_TIME}ms`,
        "transform": "scale(1)"
      };

    const messageIcon = f.cond([
      [f.eq("info"), f.always("fa-commenting")],
      [f.eq("warning"), f.always("fa-exclamation-circle")],
      [f.eq("error"), f.always("fa-exclamation-triangle")]
    ])(annotation.type);

    const timeString = new Moment(annotation.createdAt)
      .utcOffset(new Date().getTimezoneOffset())
      .format(DateTimeFormats.formatForUser);

    return (
      <div className={`annotation-item ${annotation.type}`}
        style={style}
      >
        <i className={`fa ${messageIcon} message-icon`} />
        <div className="message">
          <div className="text-label">{annotation.value || "nachricht"}</div>
          <div className="date-label">{timeString}</div>
        </div>
        <div className="info-column">
          <a href="#" className="delete-button"
            onClick={this.confirm}
          >
            <i className="fa fa-trash delete-icon" />
          </a>
          <div className="number-label">
            {`#${this.props.idx}`}
          </div>
        </div>
      </div>
    );
  }
}
