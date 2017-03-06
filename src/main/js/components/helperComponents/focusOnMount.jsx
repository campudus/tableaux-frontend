/*
 * HOC that will make its wrapped component automatically get the browser's
 * focus when mounted.
 * Wrapped components need a .focusTarget element with a .focus() method.
 */

import React, {Component} from "react";

const focusOnMount = (_Comp) => class extends Component {
  constructor(props) {
    super(props);
    this._component = null;
  }

  componentDidMount = () => {
    const focusTarget = this._component.focusTarget || this._component.refs.focusTarget;
    if (!focusTarget) {
      console.error("focusOnMount: Element", this._component, "has no valid focusTarget field");
      return;
    }
    focusTarget.focus();
  }

  render = () => {
    return (
        <_Comp {...this.props} ref={cmp => this._component = cmp} />
    );
  }
}

export default focusOnMount;
