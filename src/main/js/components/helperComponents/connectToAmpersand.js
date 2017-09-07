/*
 * HOC to replace the AmpersandMixin.
 * Usage: wrap the export or decorate the class. Automatically watches all models and collections.
 * To watch individual models in collections, start watching them in the constructor.
 *   this.props.watch(<model>, {[event: <string of events>], [force: <bool>]})
 * Force will skip the class's shouldComponentUpdate; in this case connectToAmpersand needs to be the
 * first composition of Component
 */
import React from "react";
import Events from "ampersand-events";
import * as fp from "lodash/fp";

const connectToAmpersand = (Component) => class extends React.PureComponent {
  constructor(props) {
    super(props);
    Object.assign(this, Events);
  }

  displayName = "ConnectToAmpersand";

  watch = (model, {events, force, callback} = {}) => {
    if (!model || !(model.isCollection || model.isState || model.isModel)) {
      // if it isn't an ampersand state/model or collection
      // ... don't watch for changes
      return;
    }

    const _events = events || (model.isCollection ? "add remove reset change" : "change");

    this.listenTo(model, _events, () => {
      if (callback) {
        callback(model);
      }
      if (force && this._Component) {  // avoid problems during unmounting
        this._Component.forceUpdate(); // skip Component's shouldComponentUpdate
      } else {
        this.forceUpdate(); // make normal update
      }
    });
  };

  componentDidMount = () => {
    fp.values(this.props).forEach(model => this.watch(model));
  };

  componentWillUnmount = () => {
    this.stopListening();
  };

  keepRef = (node) => {
    this._Component = node;
  };

  render() {
    return <Component ref={this.keepRef} {...this.props} watch={this.watch} />;
  }
};

export default connectToAmpersand;
