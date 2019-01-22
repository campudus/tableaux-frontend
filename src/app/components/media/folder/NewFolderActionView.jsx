import React from "react";
import PropTypes from "prop-types";
import {translate} from "react-i18next";
import {compose} from "recompose";

const NewFolderActionView = (props) => (
  <div className="new-folder-button" onClick={props.callback}>
    <i className="icon fa fa-plus" />
    <span>
      {props.t("create_new_folder")}
    </span>
  </div>
);

NewFolderActionView.propTypes = {
  callback: PropTypes.func.isRequired
};

export default compose(
  translate(["media"])
)(NewFolderActionView);
