/** Displays a cogwheel icon that, when clicked, displays an instance of TableSettingsPopup */
import React from "react";
import TableSettingsPopup from "./TableSettingsPopup";
import {contains} from "lodash/fp";

class TableSettings extends React.Component {
  constructor(props) {
    super(props);
    this.state = {open: false};
  }

  setOpenState = open => {
    this.setState({open: open});
  };

  toggleSettingsPopup = () => {
    this.setOpenState(!this.state.open);
  };

  onClickOutside = evt => {
    const target = evt.target;
    const el = this.tableSettings;
    if (!contains(target, [el, el.firstChild])) {
      this.setOpenState(false);
    }
  };

  render = () => {
    const {open} = this.state;
    return (
      <div id="table-settings-wrapper"
           onClick={this.toggleSettingsPopup}>
        <a id="table-settings"
           className={(open) ? "button active" : "button"}
           ref={tableSettings => {
             this.tableSettings = tableSettings;
           }}
           href="#">
          <i className={(open) ? "fa fa-angle-up" : "fa fa-angle-down"}>
          </i>
        </a>
        {(open)
          ? <TableSettingsPopup table={this.props.table}
                                langtag={this.props.langtag}
                                outsideClickHandler={this.onClickOutside} />
          : null
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
