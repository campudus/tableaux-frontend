import React from "react";
import PropTypes from "prop-types";
import { withTranslation } from "react-i18next";

const NewFolderActionView = props => (
  <div className="new-folder-button" onClick={props.callback}>
    <i className="icon fa fa-plus" />
    <span>{props.t("create_new_folder")}</span>
  </div>
);

NewFolderActionView.propTypes = {
  callback: PropTypes.func.isRequired,
  t: PropTypes.func.isRequired
};

export default withTranslation(["media"])(NewFolderActionView);
