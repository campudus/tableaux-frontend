import React from "react";
import PropTypes from "prop-types";
import Empty from "../helperComponents/emptyEntry";
import { DefaultLangtag } from "../../constants/TableauxConstants";
import { compose, withProps, pure, withHandlers } from "recompose";
import apiUrl from "../../helpers/apiUrl";
import f from "lodash/fp";

const enhance = compose(
  pure,
  withProps(({ file: { url }, langtag }) => ({
    fileUrl: apiUrl(f.getOr(url[DefaultLangtag], langtag, url))
  })),
  withHandlers({
    openWindow: ({ url }) => () => window.open(url)
  })
);

const MediaLink = ({ url, openWindow, children }) => {
  return (
    <a href={url} rel="noopener" target="_blank" onClick={openWindow}>
      {children || <Empty />}
    </a>
  );
};

MediaLink.propTypes = {
  file: PropTypes.object.isRequired,
  langtag: PropTypes.string
};

export default enhance(MediaLink);
