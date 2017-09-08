import React from "react";
import DateTimeEditCell from "./DateTimeEditCell.jsx";
import Moment from "moment";
import ActionCreator from "../../../actions/ActionCreator";
import {DateTimeFormats} from "../../../constants/TableauxConstants";
import {either} from "../../../helpers/functools";
import {identity, prop} from "lodash/fp";
import PropTypes from "prop-types";

class DateTimeCell extends React.PureComponent {
  static propTypes = {
    cell: PropTypes.object.isRequired,
    langtag: PropTypes.string.isRequired,
    editing: PropTypes.bool.isRequired,
    setCellKeyboardShortcuts: PropTypes.func
  };

  constructor(props) {
    super(props);
    this.state = {
      currentDateTimeValue: this.getDateTimeValue()
    };
    this.touched = false;
    this.noDateTimeText = "";
  };

  componentWillReceiveProps = (newProps) => {
    if (newProps.editing && !this.props.editing) {
      this.setState({currentDateTimeValue: this.getDateTimeValue()});
    }
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
      .map((cell.isMultiLanguage) ? prop(langtag) : identity)
      .getOrElse(null);
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
      this.touched = false;
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
      content = either((this.touched) ? this.state.currentDateTimeValue : this.getDateTimeValue())
        .map(momStr => new Moment(momStr).format(DateTimeFormats.formatForUser))
        .getOrElse(this.noDateTimeText);
    } else {
      content = <DateTimeEditCell dateTimeValue={this.state.currentDateTimeValue}
        noDateTimeText={this.noDateTimeText}
        onDateTimeUpdate={this.onDateTimeUpdate}
        formatForUser={DateTimeFormats.formatForUser}
        formatForServer={DateTimeFormats.formatForServer}
        handleEditDone={this.handleEditDone}
        setCellKeyboardShortcuts={this.props.setCellKeyboardShortcuts} />;
    }

    return (
      <div className="cell-content">
        {content}
      </div>
    );
  }
}

export default DateTimeCell;
