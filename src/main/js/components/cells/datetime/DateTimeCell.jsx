var React = require('react');
var DateTimeEditCell = require('./DateTimeEditCell.jsx');
var Moment = require('moment');
var ActionCreator = require('../../../actions/ActionCreator');
import TableauxConstants from '../../../constants/TableauxConstants';

var DateTimeCell = React.createClass({

  propTypes : {
    cell : React.PropTypes.object.isRequired,
    langtag : React.PropTypes.string.isRequired,
    editing : React.PropTypes.bool.isRequired,
    setCellKeyboardShortcuts : React.PropTypes.func
  },

  //To check if there's any date change at all
  touched : false,

  getInitialState : function () {
    var self = this;
    return {
      currentDateTimeValue : self.getDateTimeValue()
    }
  },

  noDateTimeText : "No date selected",

  getDateTimeValue : function () {
    var cellValue = this.getCellValue();
    if (cellValue) {
      var formattedVal = Moment(cellValue, TableauxConstants.DateTimeFormats.formatForServer);
      return formattedVal;
    } else {
      return null;
    }
  },

  getCellValue : function () {
    var value;
    if (this.props.cell.isMultiLanguage) {
      var currentLangValue = this.props.cell.value[this.props.langtag];
      value = currentLangValue ? currentLangValue : null;
    } else {
      var singleVal = this.props.cell.value;
      value = singleVal ? singleVal : null;
    }
    return value;
  },

  onDateTimeUpdate : function (newDateTimeValue) {
    this.setState({
      currentDateTimeValue : newDateTimeValue
    });
    this.touched = true;
  },

  handleEditDone : function (event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    var currentDateTimeValue = this.state.currentDateTimeValue;
    //only when date selected
    if (this.touched) {
      var formattedDateValue;
      var cell = this.props.cell;

      if (cell.isMultiLanguage) {
        formattedDateValue = {};
        formattedDateValue[this.props.langtag] = (currentDateTimeValue === null) ? null : currentDateTimeValue;
      } else {
        formattedDateValue = (currentDateTimeValue === null) ? null : String(currentDateTimeValue);
      }
      //Save to db
      ActionCreator.changeCell(cell, formattedDateValue);
    }
  },

  render : function () {
    var content;

    if (!this.props.editing) {
      content = (this.state.currentDateTimeValue === null) ? this.noDateTimeText : this.state.currentDateTimeValue.format(TableauxConstants.DateTimeFormats.formatForUser);
    } else {
      content = <DateTimeEditCell dateTimeValue={this.state.currentDateTimeValue}
                                  noDateTimeText={this.noDateTimeText}
                                  onDateTimeUpdate={this.onDateTimeUpdate}
                                  formatForUser={TableauxConstants.DateTimeFormats.formatForUser}
                                  formatForServer={TableauxConstants.DateTimeFormats.formatForServer}
                                  handleEditDone={this.handleEditDone}
                                  setCellKeyboardShortcuts={this.props.setCellKeyboardShortcuts}/>;
    }

    return (
      <div className="cell-content">
        {content}
      </div>
    );


  }
});

module.exports = DateTimeCell;
