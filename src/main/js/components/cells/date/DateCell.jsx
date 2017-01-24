/*
 * Cell representing a date value; displays a DateEditCell when editing === true
 * Will not look for internationalisation, as date does not depend on timezone.
 */
import React from "react";
import DateEditCell from "./DateEditCell";
import TableauxConstants from "../../../constants/TableauxConstants";
import Moment from "moment";
import ActionCreator from "../../../actions/ActionCreator";
const DateFormats = TableauxConstants.DateFormats;

class DateCell extends React.Component {

  constructor(props) {
    super(props);
    this.state = {value: this.getSavedMoment()};
  }

  getSavedMoment = () => {
    return Moment(this.props.cell.value);
  };

  momentToString = moment => {
    return moment.isValid()
      ? moment.format(DateFormats.formatForUser)
      : "-";
  };

  finishedEditing = save => {
    if (save) {
      const savedDateString = this.momentToString(this.getSavedMoment());
      const inputDate = this.state.value;
      const {cell} = this.props;
      if (savedDateString !== this.momentToString(inputDate)) {
        ActionCreator.changeCell(cell, inputDate.format(DateFormats.formatForServer));
      }
    } else { // no saving => reset display value
      this.setState({value: this.getSavedMoment()});
    }
  };

  handleDateUpdate = moment => {
    this.setState({value: moment})
  };

  render = () => {
    const {cell, editing} = this.props;
    const {value} = this.state;
    if (!editing) {
      return (
        <div className="cell-content">
          {this.momentToString(value)}
        </div>
      )
    } else {
      return (
        <DateEditCell setCellKeyboardShortcuts={this.props.setCellKeyboardShortcuts}
                      toDisplayValue={this.momentToString}
                      handleDateUpdate={this.handleDateUpdate}
                      handleEditFinished={this.finishedEditing}
                      value={value}
                      cell={cell} />
      )
    }
  }
}

DateCell.propTypes = {
  editing: React.PropTypes.bool.isRequired,
  setCellKeyboardShortcuts: React.PropTypes.func.isRequired
};

module.exports = DateCell;