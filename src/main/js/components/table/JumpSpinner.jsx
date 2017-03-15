import React from "react";
import Dispatcher from "../../dispatcher/Dispatcher";
import {ActionTypes} from "../../constants/TableauxConstants";
import i18n from "i18next";

class JumpSpinner extends React.Component {
  constructor(props) {
    super(props);

    this.state = {isLoading: false};
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
    this.setState({isLoading: true});
  };

  switchOff() {
    this.setState({isLoading: false});
  };

  render = () => {
    return (
      <div id="jump-spinner-wrapper">
        {(this.state.isLoading)
          ? <div className="jump-spinner">
            <div className="jump-spinner-content">
              <img className="jump-spinner-img" src="/img/holdOn.gif" alt="<Awesome spinner graphics>"/>
              <div className="jump-spinner-title">{i18n.t("table:jumpspinner.title")}</div>
              <div className="jump-spinner-subtitle">{i18n.t("table:jumpspinner.subtitle")}</div>
            </div>
          </div>
          : null
        }
      </div>
    );
  }
}

export default JumpSpinner;
