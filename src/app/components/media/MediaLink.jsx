import React from "react";
import PropTypes from "prop-types";
import Empty from "../helperComponents/emptyEntry";
import {DefaultLangtag} from "../../constants/TableauxConstants";
import {compose, withProps, pure, withHandlers} from "recompose";
import apiUrl from "../../helpers/apiUrl";
import f from "lodash/fp";

const enhance = compose(
  pure,
  withProps(
    ({file: {fileUrl}, langtag}) => ({fileUrl: apiUrl(f.getOr(fileUrl[DefaultLangtag], langtag, fileUrl))})
  ),
  withHandlers({
    openWindow: ({fileUrl}) => () => window.open(fileUrl)
  })
);

const MediaLink = ({fileUrl, openWindow, children}) => {
  return (
    <a href={fileUrl}
       rel="noopener"
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
