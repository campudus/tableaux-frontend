import React from "react";
import {translate} from "react-i18next";
import PropTypes from "prop-types";
import {compose, pure} from "recompose";

const PageTitle = (props) => {
  const {t, titleKey} = props;
  return (
    <div id="header-pagename">{t(titleKey)}</div>
  );
};

PageTitle.propTypes = {
  titleKey: PropTypes.string.isRequired
};

export default compose(
  pure,
  translate(["header"])
)(PageTitle);
