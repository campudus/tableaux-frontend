import React, { useEffect, useRef } from "react";
import { translate } from "react-i18next";
import { Link } from "react-router-dom";
import { buildClassName as cn } from "../../helpers/buildClassName";
import { outsideClickEffect } from "../../helpers/useOutsideClick";
import UserIcon from "../profile/UserIcon";

function UserMenu({ langtag, t }) {
  const menuRef = useRef(null);
  const [popupOpen, setPopup] = React.useState(false);
  const closePopup = React.useCallback(() => setPopup(false));
  const togglePopup = React.useCallback(() => setPopup(!popupOpen));

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
      </ul>
    </nav>
  );
}

export default translate(["header"])(UserMenu);
