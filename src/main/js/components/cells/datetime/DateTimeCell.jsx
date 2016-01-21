var React = require('react');
var Dispatcher = require('../../../dispatcher/Dispatcher');
var DateTimeEditCell = require('./DateTimeEditCell.jsx');
var Moment = require('moment');
var _ = require('lodash');
var App = require('ampersand-app');

var DateTimeCell = React.createClass({

  propTypes : {
    cell : React.PropTypes.object.isRequired,
    langtag : React.PropTypes.string.isRequired,
    editing : React.PropTypes.bool.isRequired
  },

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
      var formattedVal = Moment(cellValue, App.dateTimeFormats.formatForServer);
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
  },

  handleEditDone : function (event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    var currentDateTimeValue = this.state.currentDateTimeValue;
    //only when date selected
    if (currentDateTimeValue) {
      var formattedDateValue;
      if (this.props.cell.isMultiLanguage) {
        formattedDateValue = _.clone(this.props.cell.value);
        formattedDateValue[this.props.langtag] = currentDateTimeValue;
      } else {
        formattedDateValue = String(currentDateTimeValue);
      }
      //Save to db
      Dispatcher.trigger(this.props.cell.changeCellEvent, {newValue : formattedDateValue});
    }
  },

  render : function () {
    var content;

    if (!this.props.editing) {
      content = this.state.currentDateTimeValue ? this.state.currentDateTimeValue.format(App.dateTimeFormats.formatForUser) : this.noDateTimeText;
    } else {
      content = <DateTimeEditCell dateTimeValue={this.state.currentDateTimeValue}
                                  noDateTimeText={this.noDateTimeText}
                                  onDateTimeUpdate={this.onDateTimeUpdate}
                                  formatForUser={App.dateTimeFormats.formatForUser}
                                  formatForServer={App.dateTimeFormats.formatForServer}
                                  handleEditDone={this.handleEditDone}/>;
    }

    return (
        <div className="cell-content">
          {content}
        </div>
    );


  }
});

module.exports = DateTimeCell;
