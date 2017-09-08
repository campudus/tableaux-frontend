import React, {} from "react";
import PropTypes from "prop-types";
import * as f from "lodash/fp";

const RootButton = (props) => {
  const {activeOverlays, closeOverlay} = props;
  const bigOverlays = activeOverlays.filter(f.matchesProperty("type", "full-height"));
  if (bigOverlays.length < 2) {
    return null;
  }
  // Close all but first, as full-height overlays can't (yet?) be created from dialogs
  // => first overlay must be the root
  const closeAllButRoot = () => {
    const closeNOverlays = n => {
      closeOverlay().then(() => {   // wait for setState to finish, to avoid messing with outdated transient data
        if (n > 1) {
          closeNOverlays(n - 1);
        }
      });
    };
    closeNOverlays(activeOverlays.length - 1);
  };

  const {context, title} = f.first(activeOverlays).head.props;
  return (
    <div className="breadcrumb-wrapper">
      <a href="#" onClick={closeAllButRoot}>
        <div className="context">{context}</div>
        <div className="title">
          <i className="fa fa-long-arrow-left" />
          {title}
        </div>
      </a>
    </div>
  );
};

RootButton.propTypes = {
  activeOverlays: PropTypes.array,
  closeOverlay: PropTypes.func.isRequired
};

export default RootButton;
