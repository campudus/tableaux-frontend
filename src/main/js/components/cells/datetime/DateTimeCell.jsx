import React from "react";
import DateTimeEditCell from "./DateTimeEditCell.jsx";
import Moment from "moment";
import ActionCreator from "../../../actions/ActionCreator";
import {DateTimeFormats, FallbackLanguage} from "../../../constants/TableauxConstants";
import {either} from "../../../helpers/monads";
import {prop, identity} from "lodash/fp";

class DateTimeCell extends React.Component{

  static propTypes = {
    cell : React.PropTypes.object.isRequired,
    langtag : React.PropTypes.string.isRequired,
    editing : React.PropTypes.bool.isRequired,
    setCellKeyboardShortcuts : React.PropTypes.func
  };

  constructor(props)  {
    super(props);
    this.state = {
      currentDateTimeValue : this.getDateTimeValue()
    };
    this.touched = false;
    this.noDateTimeText = "";
  };

  getDateTimeValue = () => {
    const cellValue = this.getCellValue();
    if (cellValue) {
      return Moment(cellValue, DateTimeFormats.formatForServer);
    } else {
      return null;
    }
  };

  getCellValue = () => {
    const {cell, langtag} = this.props;
    return either(cell.value)
        .map(prop(langtag))
        .orElse(prop(FallbackLanguage))
        .orElse(identity)
        .getOrElse(null)
  };

  onDateTimeUpdate = (newDateTimeValue) => {
    this.setState({
      currentDateTimeValue: newDateTimeValue
    });
    this.touched = true;
  };

  handleEditDone = (event) => {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    const currentDateTimeValue = this.state.currentDateTimeValue;

    // only when date selected
    if (this.touched) {
      const cell = this.props.cell;

      const newCellValue = (cell.isMultiLanguage)
        ? {[this.props.langtag]: currentDateTimeValue}
        : currentDateTimeValue;

      // Save to db
      ActionCreator.changeCell(cell, newCellValue);
    }
  };

  render = () => {
    let content;

    if (!this.props.editing) {
      content = either(this.getDateTimeValue())
          .map(momStr => new Moment(momStr).format(DateTimeFormats.formatForUser))
          .getOrElse(this.noDateTimeText);
    } else {
      content = <DateTimeEditCell dateTimeValue={this.state.currentDateTimeValue}
                                  noDateTimeText={this.noDateTimeText}
                                  onDateTimeUpdate={this.onDateTimeUpdate}
                                  formatForUser={DateTimeFormats.formatForUser}
                                  formatForServer={DateTimeFormats.formatForServer}
                                  handleEditDone={this.handleEditDone}
                                  setCellKeyboardShortcuts={this.props.setCellKeyboardShortcuts}/>;
    }

    return (
      <div className="cell-content">
        {content}
      </div>
    );
  }
};

export default DateTimeCell;
