import React from "react";
import PropTypes from "prop-types";
import { Popup } from "../helperComponents/commonPatterns";
import { branch, compose, pure, renderNothing } from "recompose";
import PasteCellPreview from "./PasteCellPreview";
import f from "lodash/fp";

const onlyWhenPasteSourceExists = branch(
  props => f.isEmpty(props.pasteOriginCell),
  renderNothing
);

const PasteCellButton = () => <i className={"fa fa-clipboard"} />;

const PasteCellPopup = props => {
  return (
    <Popup
      {...props}
      container={PasteCellButton}
      popup={PasteCellPreview}
      containerClass="clipboard-icon"
    />
  );
};

PasteCellPopup.propTypes = {
  clearCellClipboard: PropTypes.func.isRequired,
  pasteOriginCell: PropTypes.object,
  pasteOriginCellLang: PropTypes.string
};

export default compose(pure, onlyWhenPasteSourceExists)(PasteCellPopup);
