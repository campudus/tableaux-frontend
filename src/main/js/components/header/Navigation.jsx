import React from "react";
import NavigationPopup from "./NavigationPopup";
import PropTypes from "prop-types";
import {withState, withHandlers, compose, pure} from "recompose";
import f from "lodash/fp";

const withPopupChild = compose(
  withState("navigationOpen", "setPopup", false),
  withHandlers({
    onButtonClicked: ({setPopup}) => (event) => {
      event.preventDefault();
      setPopup(open => !open);
    },
    onClickOutside: ({setPopup}) => () => setPopup(f.always(false))
  }),
  pure
);

const Navigation = (props) => {
  const {langtag, navigationOpen, onButtonClicked, onClickOutside} = props;

  return (
    <nav id="main-navigation-wrapper" className={navigationOpen ? "active" : ""}>
      <a id="burger" className="ignore-react-onclickoutside" href="#" onClick={onButtonClicked}>
        <i className="fa fa-bars"></i>
      </a>
      <NavigationPopup langtag={langtag}
        handleClickOutside={onClickOutside}
        navigationOpen={navigationOpen}
      />
    </nav>
  );
};

Navigation.propTypes = {
  langtag: PropTypes.string.isRequired
};

export default withPopupChild(Navigation);
