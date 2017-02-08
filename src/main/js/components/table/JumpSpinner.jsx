import React from "react";
import Dispatcher from "../../dispatcher/Dispatcher";
import {ActionTypes} from "../../constants/TableauxConstants";

class JumpSpinner extends React.Component {
  constructor(props) {
    super(props);

    this.state = {isLoading: false};
    console.log("This is the Jump Spinner!")
  }

  componentWillMount() {
    Dispatcher.on(ActionTypes.JUMP_SPINNER_ON, this.switchOn, this);
    Dispatcher.on(ActionTypes.JUMP_SPINNER_OFF, this.switchOff, this);
  };

  componentWillUnmount() {
    Dispatcher.off(ActionTypes.JUMP_SPINNER_ON, this.switchOn);
    Dispatcher.off(ActionTypes.JUMP_SPINNER_OFF, this.switchOff);
  };

  switchOn() {
    console.log("Opening Jump Spinner");
    this.setState({isLoading: true});
  };

  switchOff() {
    this.setState({isLoading: false})
  };

  render = () => {
    console.log("JumpSpinner.render", this.state);
    return (
      <div id="jump-spinner-wrapper">
        {(this.state.isLoading)
          ? <div className="jump-spinner">
            <div className="jump-spinner-content">
              <img className="jump-spinner-img" src="" alt="<Awesome spinner graphics>"/>
              <div className="jump-spinner-title">Brace yourselves</div>
              <div className="jump-spinner-subtitle">Data is coming</div>
            </div>
          </div>
          : null
        }
      </div>
    )
  }
}

export default JumpSpinner;