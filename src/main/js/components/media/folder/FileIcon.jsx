import React from "react";

function FileIcon(props) {
  const {internalFileName} = props;
  const fileExtension = internalFileName ? internalFileName.split(".").pop() : false;
  let fileIcon;
  if (fileExtension) {
    fileIcon = <img src={"/img/filetypes/" + fileExtension + "-icon-128x128.png"} alt={fileExtension}/>;
  } else {
    fileIcon = <span className="fa-stack empty-icon">
                  <i className="fa fa-file-o fa-stack-2x"></i>
                  <i className="fa fa-plus fa-stack-1x"></i>
                </span>;
  }
  return <span className="file-icon">{fileIcon}</span>;
};

FileIcon.propTypes = {
  internalFileName: React.PropTypes.string
};

export default FileIcon;
