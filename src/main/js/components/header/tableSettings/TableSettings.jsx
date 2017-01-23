/** Displays a cogwheel icon that, when clicked, displays an instance of TableSettingsPopup */

import React from "react";
import TableSettingsPopup from "./TableSettingsPopup";

class TableSettings extends React.Component {
  constructor(props) {
    super(props);
    this.state = {open: false};
  }

  setOpenState = open => {
    console.log("setOpenState:", open);
    this.setState({open: open})
  };

  toggleSettingsPopup = (evt) => {
    this.setOpenState(!this.state.open);
    evt.stopPropagation();
  };

  onClickOutside = evt => {
    const target = evt.target;
    const el = document.getElementById("table-settings")
    console.log("TableSettings.onClickOutside", target, el, target === el)
    if (target !== el) {
      this.setOpenState(false)
    }
  };

  render = () => {
    const {open} = this.state;
    const css_class = (open) ? "button active" : "button";
    return (
      <div id="table-settings-wrapper"
           onClick={this.toggleSettingsPopup}>
        <a id="table-settings" className={css_class} href="#">
          <i className="fa fa-cogs aria-button">
          </i>
        </a>
        {(open) ?
          <TableSettingsPopup table={this.props.table}
                         langtag={this.props.langtag}
                         outsideClickHandler={this.onClickOutside} /> :
          null
        }
      </div>
    );
  }
}

TableSettings.propTypes = {
  table: React.PropTypes.object.isRequired,
  langtag: React.PropTypes.string.isRequired
};

module.exports = TableSettings;