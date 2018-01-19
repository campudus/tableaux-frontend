import React from "react";
import PropTypes from "prop-types";
import {compose, pure} from "recompose";
import i18n from "i18next";

const PageTitle = (props) => {
  const {titleKey} = props;
  return (
    <div id="header-pagename">{i18n.t("header:" + titleKey)}</div>
  );
};

PageTitle.propTypes = {
  titleKey: PropTypes.string.isRequired
};

export default compose(
  pure,
)(PageTitle);
