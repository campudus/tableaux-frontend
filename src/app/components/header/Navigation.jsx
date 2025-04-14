import f from "lodash/fp";
import PropTypes from "prop-types";
import React from "react";
import listensToClickOutside from "react-onclickoutside";
import { useSelector } from "react-redux";
import {
  filterMainMenuServices,
  getAllServices
} from "../../frontendServiceRegistry/frontendServices";
import { buildClassName } from "../../helpers/buildClassName";
import NavigationPopup from "./NavigationPopup";

const SelfClosingNavigationPopup = listensToClickOutside(NavigationPopup);

const Navigation = ({ langtag }) => {
  const services = useSelector(
    f.compose(filterMainMenuServices, getAllServices)
  );
  const [popupOpen, setPopup] = React.useState(false);
  const closePopup = React.useCallback(() => setPopup(false));
  const togglePopup = React.useCallback(() => setPopup(!popupOpen));
  const buttonClass = buildClassName("small-button", {
    "ignore-react-onclickoutside": popupOpen
  });

  return (
    <nav id="main-navigation-wrapper" className={popupOpen ? "active" : ""}>
      <button id="burger" className={buttonClass} onClick={togglePopup}>
        <i className="fa fa-bars" />
      </button>
      <div onClick={closePopup}>
        <SelfClosingNavigationPopup
          langtag={langtag}
          handleClickOutside={closePopup}
          navigationOpen={popupOpen}
          services={services || []}
        />
      </div>
    </nav>
  );
};

Navigation.propTypes = {
  langtag: PropTypes.string.isRequired
};

export default Navigation;
