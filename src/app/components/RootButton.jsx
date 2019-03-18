import React from "react";
import * as f from "lodash/fp";

import PropTypes from "prop-types";

import { isCell } from "../specs/cell-spec";
import OverlayHadRowIdentificator from "./overlay/OverlayHeadRowIdentificator";

const RootButton = props => {
  const { activeOverlays, closeOverlay, langtag } = props;
  const bigOverlays = activeOverlays.filter(
    f.matchesProperty("type", "full-height")
  );
  if (bigOverlays.length < 2) {
    return null;
  }
  // Close all but first, as full-height overlays can't (yet?) be created from dialogs
  // => first overlay must be the root
  const closeAllButRoot = () => {
    const closeNOverlays = n => {
      closeOverlay().then(() => {
        // wait for setState to finish, to avoid messing with outdated transient data
        if (n > 1) {
          closeNOverlays(n - 1);
        }
      });
    };
    closeNOverlays(activeOverlays.length - 1);
  };

  const { context, title, cell } = f.first(activeOverlays).head.props;
  console.log("RootButton props", props, { cell });
  const titleToDisplay =
    cell && isCell(cell) ? (
      <OverlayHadRowIdentificator
        cell={{ ...cell, value: f.prop(["row", "values", 0], cell) }}
        langtag={langtag}
      />
    ) : (
      title
    );
  return (
    <div className="breadcrumb-wrapper">
      <a href="#" onClick={closeAllButRoot}>
        <div className="context">{context}</div>
        <div className="title">
          <i className="fa fa-long-arrow-left" />
          {titleToDisplay}
        </div>
      </a>
    </div>
  );
};

RootButton.propTypes = {
  activeOverlays: PropTypes.array.isRequired,
  closeOverlay: PropTypes.func.isRequired,
  langtag: PropTypes.string.isRequired
};

export default RootButton;
