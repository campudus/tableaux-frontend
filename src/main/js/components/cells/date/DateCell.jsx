/*
 * Cell representing a date value; displays a DateEditCell when editing === true
 * Will not look for internationalisation, as date does not depend on timezone.
 */
import React from "react";
import DateEditCell from "./DateEditCell";
import {DateFormats} from "../../../constants/TableauxConstants";
import Moment from "moment";
import ActionCreator from "../../../actions/ActionCreator";
import {either} from "../../../helpers/monads";

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

  finishedEditing = save => {
    if (save) {
      const {cell} = this.props;
      const inputDate = this.state.value;
      const savedDateString = this.momentToString(this.getSavedMoment());
      if (savedDateString !== this.momentToString(inputDate)) {
        const newValue = either(inputDate)
          .map( m => m.format(DateFormats.formatForServer))
          .getOrElse(null);
        ActionCreator.changeCell(cell, newValue);
      }
    } else {
        this.setState({value: this.getSavedMoment()});
    }
  };

  handleDateUpdate = (moment, cb) => {
    (cb)
      ? this.setState({value: moment}, cb)
      : this.setState({value: moment});
  };

  render = () => {
    const {cell, editing} = this.props;
    if (!editing) {
      return (
        <div className="cell-content">
          {this.momentToString(this.getSavedMoment())}
        </div>
      )
    } else {
      return (
        <DateEditCell setCellKeyboardShortcuts={this.props.setCellKeyboardShortcuts}
                      toDisplayValue={this.momentToString}
                      handleDateUpdate={this.handleDateUpdate}
                      handleEditFinished={this.finishedEditing}
                      value={this.state.value || new Moment()}
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