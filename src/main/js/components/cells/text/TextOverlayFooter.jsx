import React from "react";
import ActionCreator from "../../../actions/ActionCreator";
import {pure, withHandlers, compose} from "recompose";

const withButtonHandlers = withHandlers({
  onSave: (props) => ActionCreator.saveOverlayTypeText(),
  onCancel: (props) => ActionCreator.closeOverlayTypeText()
});

const TextOverlayFooter = props => (
  <div className="button-wrapper">
    <button className="button positive" onClick={this.onSaveHandler}>Speichern</button>
    <button className="button neutral" onClick={this.onCancelHandler}>Abbrechen</button>
  </div>
);

export default compose(
  withButtonHandlers,
  pure
)(TextOverlayFooter);
