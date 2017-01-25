/*
 * Cell representing a date value; displays a DateEditCell when editing === true
 * Will not look for internationalisation, as date does not depend on timezone.
 */
import React from "react";
import DateEditCell from "./DateEditCell";
import TableauxConstants from "../../../constants/TableauxConstants";
import Moment from "moment";
import ActionCreator from "../../../actions/ActionCreator";
import keyMirror from "keymirror";
const DateFormats = TableauxConstants.DateFormats;

const OPTIONS = keyMirror({
  "SAVE": null,
  "CANCEL": null,
  "CLEAR": null
});

class DateCell extends React.Component {

  constructor(props) {
    super(props);
    this.state = {value: this.getSavedMoment()};
  }

  getSavedMoment = () => {
    return Moment(this.props.cell.value);
  };

  momentToString = moment => {
    return (moment && moment.isValid())
      ? moment.format(DateFormats.formatForUser)
      : "";
  };

  finishedEditing = option => {
    const {cell} = this.props;
    switch (option) {
      case OPTIONS.SAVE:
        const inputDate = this.state.value;
        const savedDateString = this.momentToString(this.getSavedMoment());
        if (savedDateString !== this.momentToString(inputDate)) {
          ActionCreator.changeCell(cell, inputDate.format(DateFormats.formatForServer));
        }
        break;
      case OPTIONS.CLEAR:
        ActionCreator.changeCell(cell, null);
        break;
      default:
        this.setState({value: this.getSavedMoment()});
    }
  };

  handleDateUpdate = moment => {
    this.setState({value: moment});
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
                      OPTIONS={OPTIONS}
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