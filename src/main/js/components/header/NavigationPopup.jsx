import React from "react";
import {translate} from "react-i18next";
import SvgIcon from "../helperComponents/SvgIcon";
import PropTypes from "prop-types";
import {branch, compose, pure, renderNothing} from "recompose";
import handleClickOutside from "react-onclickoutside";
import Link from "../helperComponents/Link";

const NavigationPopup = (props) => {
  const {langtag, t} = props;
  return (
    <div id="main-navigation">
      <div id="logo">
        <SvgIcon icon={"/img/GRUD-Logo.svg"} />
      </div>
      <ul id="main-navigation-list">

        <li>
          <Link href={"/" + langtag + "/table"}>
            <i className="fa fa-columns" />
            {t("header:menu.tables")}
          </Link>
        </li>

        <li>
          <Link href={"/" + langtag + "/media"}>
            <i className="fa fa-file" />
            {t("header:menu.media")}
          </Link>
        </li>

        <li>
          <Link href={"/" + langtag + "/dashboard"}>
            <i className="fa fa-dashboard" />
            {t("header:menu.dashboard")}
          </Link>
        </li>
      </ul>
    </div>
  );
};

NavigationPopup.propTypes = {
  langtag: PropTypes.string.isRequired
};

export default compose(
  branch(
    (props) => !props.navigationOpen,
    renderNothing
  ),
  pure,
  translate(["header"]),
  handleClickOutside
)(NavigationPopup);
