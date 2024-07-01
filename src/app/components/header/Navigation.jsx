import React from "react";
import NavigationPopup from "./NavigationPopup";
import PropTypes from "prop-types";
import listensToClickOutside from "react-onclickoutside";
import { useSelector } from "react-redux";
import f from "lodash/fp";
import {
  filterMainMenuServices,
  getAllServices
} from "../../frontendServiceRegistry/frontendServices";

const SelfClosingNavigationPopup = listensToClickOutside(NavigationPopup);

const Navigation = ({ langtag }) => {
  const services = useSelector(
    f.compose(
      filterMainMenuServices,
      getAllServices
    )
  );
  const [popupOpen, setPopup] = React.useState(false);
  const closePopup = React.useCallback(() => setPopup(false));
  const togglePopup = React.useCallback(() => setPopup(!popupOpen));

  return (
    <nav id="main-navigation-wrapper" className={popupOpen ? "active" : ""}>
      <button
        id="burger"
        className={popupOpen ? "ignore-react-onclickoutside" : ""}
        onClick={togglePopup}
      >
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
