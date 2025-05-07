import React from "react";
import f from "lodash/fp";
import { when } from "./functools";

export const safeRender = render => () => {
  try {
    return render();
  } catch (err) {
    console.error(err);
    return <div>{err.stack}</div>;
  }
};

export const reportUpdateReasons = title =>
  /**
   * usage: componentWillUpdate = reportUpdateReasons("SomeComp")
   * or
   * componentWillUpdate(nextProps, nextState) {
   *   reportUpdateReasons("SomeComp").call(this, nextProps, nextState)
   *   performStuff()
   * }
   */
  function(nextProps, nextState) {
    this.renderCount = (this.renderCount || 0) + 1;
    const getChanges = (keys, a, b) => keys.filter(k => !f.equals(a[k], b[k]));
    const changes = {
      props: when(
        f.isEmpty,
        () => "unchanged"
      )(getChanges(f.keys(nextProps), this.props, nextProps)),
      state: when(
        f.isEmpty,
        () => "unchanged"
      )(getChanges(f.keys(nextState), this.state, nextState))
    };

    console.log(
      `Render #${this.renderCount} of`,
      title || this.displayName,
      JSON.stringify(changes)
    );
  };
