import React, { Component } from "react";
import NavigationPopup from "./NavigationPopup";
import PropTypes from "prop-types";
import { withState, withHandlers, compose, pure } from "recompose";
import f from "lodash/fp";

const withPopupChild = compose(
  withState("navigationOpen", "setPopup", false),
  withHandlers({
    onButtonClicked: ({ setPopup }) => event => {
      event.preventDefault();
      setPopup(open => !open);
    },
    onClickOutside: ({ setPopup }) => () => setPopup(f.always(false))
  }),
  pure
);

class Navigation extends Component {
  state = {
    navigationOpen: false
  };

  onButtonClicked = event => {
    event.preventDefault();
    this.setState(prevState => {
      return { navigationOpen: !prevState.navigationOpen };
    });
  };

  render() {
    const { langtag, onClickOutside } = this.props;
    const { navigationOpen } = this.state;

    return (
      <nav
        id="main-navigation-wrapper"
        className={navigationOpen ? "active" : ""}
      >
        <a
          id="burger"
          className="ignore-react-onclickoutside"
          href="#"
          onClick={this.onButtonClicked}
        >
          <i className="fa fa-bars" />
        </a>
        <NavigationPopup
          langtag={langtag}
          handleClickOutside={onClickOutside}
          navigationOpen={navigationOpen}
        />
      </nav>
    );
  }
}

Navigation.propTypes = {
  langtag: PropTypes.string.isRequired,
  onClickOutside: PropTypes.func
};

export default withPopupChild(Navigation);
