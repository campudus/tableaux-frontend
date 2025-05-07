import classNames from "classnames";
import PropTypes from "prop-types";
import React, { useEffect, useRef, useState } from "react";
import { Langtags } from "../../constants/TableauxConstants";
import { getLanguageOrCountryIcon } from "../../helpers/multiLanguage";
import { outsideClickEffect } from "../../helpers/useOutsideClick";

const Popup = ({ langtag, handleLangtagSwitch, onClose }) => {
  const container = useRef();
  useEffect(
    outsideClickEffect({
      shouldListen: true,
      containerRef: container,
      onOutsideClick: onClose
    }),
    [container.current, onClose]
  );
  return (
    <div ref={container} className="language-switcher__dropdown">
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
};

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
          <Popup
            handleClickOutside={closePopup}
            langtag={contentLangtag}
            handleLangtagSwitch={handleLangtagSwitch}
            onClose={closePopup}
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
