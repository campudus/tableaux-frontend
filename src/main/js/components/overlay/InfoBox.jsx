import React, {Component} from "react";
import PropTypes from "prop-types";

class InfoBox extends Component {
  static PropTypes = {
    message: PropTypes.string.isRequired,
    heading: PropTypes.string,
    type: PropTypes.string
  };

  render() {
    const {message, heading, type} = this.props;
    const cssClass = "info " + (type || "");
    const icons = {
      warning: "fa-warning",
      question: "fa-question-circle",
      default: "fa-info-circle"
    };
    const iconClass = icons[type] || icons["default"];
    return (
      <div className={cssClass}>
        <div className="info-icon"><i className={"fa " + iconClass} /></div>
        <div className="message-content">
          {(heading) ? <div className="headline">{heading}</div> : null}
          <div className="message">{message}</div>
        </div>
      </div>
    );
  }
}

export default InfoBox;
