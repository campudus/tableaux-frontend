import React from "react";
import {translate} from "react-i18next";
import SvgIcon from "../helperComponents/SvgIcon";
import PropTypes from "prop-types";
import {branch, compose, pure, renderNothing} from "recompose";
import handleClickOutside from "react-onclickoutside";

const NavigationPopup = (props) => {
  const {langtag, t} = props;
  return (
    <div id="main-navigation">
      <div id="logo">
        <SvgIcon icon={"/img/GRUD-Logo.svg"}/>
      </div>
      <ul id="main-navigation-list">
        <li><a href={ "/" + langtag + "/table" }><i className="fa fa-columns"></i>{t("header:menu.tables")}
        </a></li>
        <li><a href={ "/" + langtag + "/media" }><i className="fa fa-file"></i>{t("header:menu.media")}</a>
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
