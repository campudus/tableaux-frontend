import React from "react";
import PropTypes from "prop-types";
import {
  branch,
  componentFromProp,
  compose,
  pure,
  renderNothing,
  setPropTypes,
  withHandlers,
  withState
} from "recompose";
import f from "lodash/fp";
import listenToClickOutside from "react-onclickoutside";

/**
 * Creates a "container" element that handles opening and closing of a "popup" element.
 * The properties "container" and "popup" need to hold valid react element constructors.
 * All props required either by the button container or the popup itself must be passed
 * to Popup, it will propagate those to the enhanced elements, along with:
 *   popupOpen: boolean
 *   openPopup: function: () -> void
 *   closePopup: function: () -> void
 *   togglePopup: function: () -> void
 *  The component will be wrapped in a div of class "props.containerClass" and get the
 *  "popup-open" class added when needed.
 *  See it in action e.g. in FilterRow.jsx
 */
export const Popup = compose(
  pure,
  setPropTypes({
    container: PropTypes.any.isRequired,
    popup: PropTypes.any.isRequired,
    containerClass: PropTypes.string
  }),
  withState("popupOpen", "updatePopupState", false),
  withHandlers({
    openPopup: ({ updatePopupState }) => () => updatePopupState(f.always(true)),
    closePopup: ({ updatePopupState, onClose }) => () => {
      f.isFunction(onClose) && onClose();
      updatePopupState(f.always(false));
    }
  }),
  withHandlers({
    togglePopup: ({ popupOpen, openPopup, closePopup }) => () =>
      (popupOpen ? closePopup : openPopup)()
  })
)(props => {
  const Container = componentFromProp("container");
  const PopupElement = componentFromProp("popup");

  const PopupFragment = compose(
    branch(props => !props.popupOpen, renderNothing),
    withHandlers({ handleClickOutside: ({ closePopup }) => closePopup }),
    listenToClickOutside
  )(PopupElement);

  return (
    <div
      style={{ cursor: "pointer" }}
      className={`${props.containerClass || ""} ${
        props.popupOpen ? "popup-open ignore-react-onclickoutside" : ""
      }`}
      onClick={props.togglePopup}
    >
      <Container {...props} />
      <PopupFragment {...props} />
    </div>
  );
});
