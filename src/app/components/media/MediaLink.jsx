import React from "react";
import PropTypes from "prop-types";
import Empty from "../helperComponents/emptyEntry";
import { retrieveTranslation } from "../../helpers/multiLanguage";
import { compose, withProps, pure, withHandlers } from "recompose";
import apiUrl from "../../helpers/apiUrl";

const enhance = compose(
  pure,
  withProps(({ file: { url }, langtag }) => {
    return {
      fileUrl: apiUrl(retrieveTranslation(langtag, url))
    };
  }),
  withHandlers({
    openWindow: ({ fileUrl }) => () => window.open(fileUrl)
  })
);

const MediaLink = ({ url, openWindow, children }) => {
  return (
    <a
      href={url}
      rel="noopener noreferrer"
      target="_blank"
      onClick={openWindow}
    >
      {children || <Empty />}
    </a>
  );
};

MediaLink.propTypes = {
  file: PropTypes.object.isRequired,
  langtag: PropTypes.string
};

export default enhance(MediaLink);
