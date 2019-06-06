import React from "react";
import NavigationPopup from "./NavigationPopup";
import PropTypes from "prop-types";
import listensToClickOutside from "react-onclickoutside";

const SelfClosingNavigationPopup = listensToClickOutside(NavigationPopup);

const Navigation = ({ langtag, services }) => {
  const [popupOpen, setPopup] = React.useState(false);
  const closePopup = React.useCallback(() => setPopup(false));
  const togglePopup = React.useCallback(() => setPopup(!popupOpen));

  return (
    <nav id="main-navigation-wrapper" className={popupOpen ? "active" : ""}>
      <a
        id="burger"
        className={popupOpen ? "ignore-react-onclickoutside" : ""}
        href="#"
        onClick={togglePopup}
      >
        <i className="fa fa-bars" />
      </a>
      <SelfClosingNavigationPopup
        langtag={langtag}
        handleClickOutside={closePopup}
        navigationOpen={popupOpen}
        services={services || []}
      />
    </nav>
  );
};

Navigation.propTypes = {
  langtag: PropTypes.string.isRequired
};

export default Navigation;
