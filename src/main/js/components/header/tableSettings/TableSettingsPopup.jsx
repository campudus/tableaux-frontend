/*
 * Content for the TableSettings menu. Entries are individual React items with specific functions.
 */

import React from "react";
import NameEditor from './NameEditor'
import listensToClickOutside from "react-onclickoutside/decorator";

@listensToClickOutside
class TableSettingsPopup extends React.Component{
  handleClickOutside = evt => {
    this.props.outsideClickHandler(evt);
  };

  render() {
    const {table, langtag} = this.props;
    return (
      <div id="table-settings-popup">
        <NameEditor table={table} langtag={langtag} />
      </div>
    );
  }
}

TableSettingsPopup.propTypes = {
  table: React.PropTypes.object.isRequired,
  langtag: React.PropTypes.string.isRequired,
  outsideClickHandler: React.PropTypes.func.isRequired
};

module.exports = TableSettingsPopup;