import React from "react";
import listensToClickOutside from "react-onclickoutside";
import PropTypes from "prop-types";

import Datetime from "react-datetime";

import ActionCreator from "../../../actions/ActionCreator";

import {Directions} from "../../../constants/TableauxConstants";

@listensToClickOutside
class DateTimeEditCell extends React.Component {
  componentDidMount = () => {
    this.props.setCellKeyboardShortcuts(this.getKeyboardShortcuts());
  };

  componentWillUnmount = () => {
    this.props.handleEditDone();
    // Important to clean up the keyboard shortcuts
    this.props.setCellKeyboardShortcuts({});
  };

  getKeyboardShortcuts = () => {
    return {
      tab: function () {
        ActionCreator.toggleCellEditing(false);
        ActionCreator.selectNextCell(Directions.RIGHT);
      },
      enter: function () {
        ActionCreator.toggleCellEditing(false);
        ActionCreator.selectNextCell(Directions.DOWN);
      },
      escape: function () {
        ActionCreator.toggleCellEditing(false);
      },
      always: function (event) {
        event.preventDefault();
        event.stopPropagation();
      }
    };
  };

  handleClickClearDate = (event) => {
    event.preventDefault();
    event.stopPropagation();
    this.props.onDateTimeUpdate(null);
    ActionCreator.toggleCellEditing(false);
  };

  handleClickOutside = (event) => {
    ActionCreator.toggleCellEditing(false);
  };

  showDateTimeValue = () => {
    return this.props.dateTimeValue === null
      ? this.props.noDateTimeText
      : this.props.dateTimeValue.format(this.props.formatForUser);
  };

  render = () => {
    return (
      <div>
        {this.showDateTimeValue()}
        <i className="fa fa-ban" onClick={this.handleClickClearDate}></i>
        <Datetime onChange={this.props.onDateTimeUpdate}
          open={true}
          input={false}
          value={this.props.dateTimeValue}/>
      </div>
    );
  }
};

DateTimeEditCell.propTypes = {
  formatForUser: PropTypes.string,
  formatForServer: PropTypes.string,
  dateTimeValue: PropTypes.object,
  onDateTimeUpdate: PropTypes.func,
  handleEditDone: PropTypes.func,
  noDateTimeText: PropTypes.string,
  setCellKeyboardShortcuts: PropTypes.func
};

module.exports = DateTimeEditCell;
