import React from "react";
import PropTypes from "prop-types";
import { pure } from "recompose";

function FileIcon(props) {
  const { internalFileName } = props;
  const fileExtension = internalFileName
    ? internalFileName.split(".").pop()
    : false;
  let fileIcon;
  if (fileExtension) {
    fileIcon = (
      <img
        src={"/img/filetypes/" + fileExtension + "-icon-128x128.png"}
        alt={fileExtension}
      />
    );
  } else {
    fileIcon = (
      <span className="fa-stack empty-icon">
        <i className="fa fa-file-o fa-stack-2x" />
        <i className="fa fa-plus fa-stack-1x" />
      </span>
    );
  }
  return <span className="file-icon">{fileIcon}</span>;
}

FileIcon.propTypes = {
  internalFileName: PropTypes.string
};

export default pure(FileIcon);
