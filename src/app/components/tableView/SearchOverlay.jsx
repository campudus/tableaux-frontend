import React from "react";
import {Portal} from "react-portal";
import {branch, pure, renderNothing} from "recompose";
import i18n from "i18next";

const SearchOverlayFrag = pure(
  (props) => (
    <Portal isOpened>
      <div className="search-overlay">
        <div className="heading">{i18n.t("filter:searching")}</div>
        <div className="message">{i18n.t("filter:searching-sub")}</div>
      </div>
    </Portal>
  )
);

export default branch(
  (props) => !props.isOpen,
  renderNothing
)(SearchOverlayFrag);
