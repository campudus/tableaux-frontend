/** Displays a cogwheel icon that, when clicked, displays an instance of TableSettingsPopup */
import { contains } from "lodash/fp";
import React from "react";

import PropTypes from "prop-types";

import { config } from "../../../constants/TableauxConstants";
import TableSettingsPopup from "./TableSettingsPopup";

class TableSettings extends React.Component {
  constructor(props) {
    super(props);
    this.state = { open: false };
  }

  setOpenState = open => {
    this.setState({ open: open });
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
    const { open } = this.state;
    return (
      config.showTableDropdown && (
        <div id="table-settings-wrapper" onClick={this.toggleSettingsPopup}>
          <button
            id="table-settings"
            className={open ? "button active" : "button"}
            ref={tableSettings => {
              this.tableSettings = tableSettings;
            }}
          >
            <i className={open ? "fa fa-angle-up" : "fa fa-angle-down"} />
          </button>
          {open ? (
            <TableSettingsPopup
              table={this.props.table}
              langtag={this.props.langtag}
              onClose={this.onClickOutside}
              actions={this.props.actions}
            />
          ) : null}
        </div>
      )
    );
  };
}

TableSettings.propTypes = {
  table: PropTypes.object.isRequired,
  langtag: PropTypes.string.isRequired
};

export default TableSettings;
