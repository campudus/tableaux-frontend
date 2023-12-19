import React, { useState } from "react";
import withClickOutside from "react-onclickoutside";

import PropTypes from "prop-types";
import classNames from "classnames";

import { Langtags } from "../../constants/TableauxConstants";
import { getLanguageOrCountryIcon } from "../../helpers/multiLanguage";

const Popup = ({ langtag, handleLangtagSwitch }) => (
  <div className="language-switcher__dropdown">
    {Langtags.filter(lt => lt !== langtag).map(lt => {
      return (
        <div key={lt} className="language-switcher__menu-item">
          <button
            className="language-switcher__switch-language-button"
            onClick={handleLangtagSwitch(lt)}
          >
            {getLanguageOrCountryIcon(lt, "language")}
          </button>
        </div>
      );
    })}
  </div>
);

const OverlayHeaderLanguageSwitcher = props => {
  const { contentLangtag, handleChange, classes } = props;

  const [open, setOpen] = useState(false);
  const closePopup = () => setOpen(false);
  const togglePopup = () => setOpen(!open);
  const cssClass = classNames("overlay-header-language-switcher", {
    "language-switcher--open": open
  });
  const handleLangtagSwitch = langtag => () => {
    handleChange(langtag);
    closePopup();
  };

  const SelfClosingPopup = withClickOutside(Popup);

  return (
    <div className={`overlay-header-language-switcher__wrapper ${classes}`}>
      <div className={cssClass} onClick={togglePopup}>
        <div className="language-switcher__label">
          {getLanguageOrCountryIcon(contentLangtag)}
          <i
            className={
              open
                ? "language-switcher__arrow-icon fa fa-angle-up"
                : "language-switcher__arrow-icon fa fa-angle-down"
            }
          />
        </div>
        {open ? (
          <SelfClosingPopup
            handleClickOutside={closePopup}
            langtag={contentLangtag}
            handleLangtagSwitch={handleLangtagSwitch}
          />
        ) : null}
      </div>
    </div>
  );
};

export default OverlayHeaderLanguageSwitcher;

OverlayHeaderLanguageSwitcher.propTypes = {
  contentLangtag: PropTypes.string.isRequired,
  handleChange: PropTypes.func.isRequired,
  classes: PropTypes.string
};
