import React from "react";
import PropTypes from "prop-types";
import {compose, pure, withHandlers, withProps} from "recompose";
import App from "ampersand-app";
import f from "lodash/fp";

const Link = ({handleClick, url, children, className}) => (
  <a href={url}
     onClick={handleClick}
     className={className}
  >
    {children}
  </a>
);

const enhance = compose(
  pure,
  withProps(({to, href}) => {
    if (!f.isNil(to)) {
      console.error("Generating urls from objects not yet supported");
    }
    return {url: href};
  }),
  withHandlers({
    handleClick: ({isExternal = false, newTab = false, url}) => (event) => {
      event.preventDefault();
      if (newTab) {
        window.open(url);
      } else if (isExternal) {
        document.location = url;
      } else {
        App.router.history.navigate(url, {trigger: true});
      }
    }
  })
);

Link.propTypes = {
  to: PropTypes.object,
  href: PropTypes.string,
  isExternal: PropTypes.bool,
  newTab: PropTypes.bool
};

export default enhance(Link);
