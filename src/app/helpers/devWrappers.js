import React from "react";
import f from "lodash/fp";

export const safeRender = render => () => {
  try {
    return render();
  } catch (err) {
    console.error(err);
    return <div>{err.stack}</div>;
  }
};

export const reportUpdateReasons = (title = "Component") =>
  // usage: componentWillUpdate = reportUpdateReasons("SomeComp").bind(this)
  function(nextProps, nextState) {
    const getChanges = (keys, a, b) => keys.filter(!f.equals(a[k], b[k]));
    const changes = {
      props: getChanges(f.keys(nextProps), this.props, nextProps),
      state: getChanges(f.keys(nextState), this.state, nextState)
    };

    console.log("Rendered", title, JSON.stringify(changes));
  };
