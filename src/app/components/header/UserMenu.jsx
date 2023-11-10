import React, { useEffect, useRef } from "react";
import { translate } from "react-i18next";
import { Link } from "react-router-dom";
import { noAuthNeeded } from "../../helpers/authenticate";
import { getLogin } from "../../helpers/authenticate";
import { buildClassName as cn } from "../../helpers/buildClassName";
import { outsideClickEffect } from "../../helpers/useOutsideClick";
import { getUserName } from "../../helpers/userNameHelper";
import UserIcon from "../profile/UserIcon";

function UserMenu({ langtag, t }) {
  const menuRef = useRef(null);
  const [popupOpen, setPopup] = React.useState(false);
  const closePopup = React.useCallback(() => setPopup(false));
  const togglePopup = React.useCallback(() => setPopup(!popupOpen));

  const userName = getUserName();
  const handleLogout = React.useCallback(() => {
    getLogin().logout();
  });

  useEffect(
    outsideClickEffect({
      shouldListen: popupOpen,
      onOutsideClick: closePopup,
      containerRef: menuRef
    }),
    [popupOpen, menuRef.current]
  );

  return (
    <nav ref={menuRef} className={cn("user-menu", { active: popupOpen })}>
      <button className="user-menu__toggle" onClick={togglePopup}>
        <UserIcon className="user-menu__icon" />
      </button>

      <ul className="user-menu__list">
        <li className="user-menu__entry">
          <Link to={"/" + langtag + "/profile"} className="user-menu__link">
            <i className="fa fa-user-circle" />
            {t("header:menu.profile")}
          </Link>
        </li>

        {!noAuthNeeded() && (
          <li className="user-menu__entry">
            <button className="user-menu__button" onClick={handleLogout}>
              <i className="fa fa-power-off" />
              {t("header:menu.logout")}
              <span className="user-menu__user-name">{`(${userName})`}</span>
            </button>
          </li>
        )}
      </ul>
    </nav>
  );
}

export default translate(["header"])(UserMenu);
