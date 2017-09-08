import React from "react";
import PropTypes from "prop-types";
import {withHandlers, pure, compose} from "recompose";

const withFunctionality = compose(
  withHandlers({
    onClick: (props) => (event) => props.onTrigger(event)
  }),
  pure
);

const ExpandButton = (props) => (
  <button className="expand"
    onClick={props.onClick}>
    <span className="fa fa-expand" />
  </button>
);

ExpandButton.propTypes = {
  onTrigger: PropTypes.func.isRequired
};

export default withFunctionality(ExpandButton);
