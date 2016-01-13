var React = require('react');
var ReactDOM = require('react-dom');
var _ = require('lodash');
var Dispatcher = require('../../../dispatcher/Dispatcher');
var OutsideClick = require('react-onclickoutside');
var Datetime = require('react-datetime');
var Moment = require('moment');

var DateTimeCell = React.createClass({

    mixins : [OutsideClick],
    propTypes : {
      cell : React.PropTypes.object.isRequired,
      langtag : React.PropTypes.string.isRequired
    },

    statics : {
      formatForServer : "YYYY-MM-DDTHH:mm:SS.SSSZ",
      formatForUser : "DD.MM.YYYY - HH:mm",
    },

    componentDidMount : function () {

    },

    getInitialState : function () {
      return {
        isEditing : false,
        selectedDateTime : null
      }
    },

    handleClickOutside : function (event) {
      if (!ReactDOM.findDOMNode(this).contains(event.target)) {
        this.handleEditDone();
      }
    },

    handleLabelClick : function (event) {
      event.stopPropagation();
      event.preventDefault();
      this.setState({isEditing : true});
    },

    handleEditDone : function () {
      if (this.state.isEditing) {
        this.setState({isEditing : false});
        var selectedDateTime = this.state.selectedDateTime;
        //when no date selected
        if (!selectedDateTime) {
          return;
        }

        var formattedDateValue;
        if (this.props.cell.isMultiLanguage) {
          formattedDateValue = _.clone(this.props.cell.value);
          formattedDateValue[this.props.langtag] = this.state.selectedDateTime.format(this.constructor.formatForServer);
        } else {
          var value = this.state.selectedDateTime;
          formattedDateValue = String(value.format(this.constructor.formatForServer));
        }
        //Save to db
        Dispatcher.trigger(this.props.cell.changeCellEvent, {newValue : formattedDateValue});

      }
    },

    showDateTimeValue : function () {
      var selectedDateTime = this.state.selectedDateTime;
      if (selectedDateTime && !_.isEmpty(selectedDateTime)) {
        return selectedDateTime.format(this.constructor.formatForUser);
      } else if (this.getCellValue()) {
        var formattedVal = Moment(this.getCellValue(), this.constructor.formatForServer).format(this.constructor.formatForUser);
        return formattedVal;
      } else {
        return "No date selected";
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

    onDateTimeChange : function (moment) {
      this.setState({selectedDateTime : moment});
    },

    selectDate : function () {
      if (this.state.selectedDateTime) {
        return this.state.selectedDateTime;
      } else {
        return Moment(this.getCellValue(), this.constructor.formatForServer);
      }
    },

    render : function () {
      var cell = this.props.cell;
      var theClassName = 'cell-content';
      if (this.state.isEditing) {
        theClassName += ' editing';
      }
      return (
        <div className={theClassName} onClick={this.handleLabelClick}>
          {this.showDateTimeValue()}
          {this.state.isEditing? <Datetime onChange={this.onDateTimeChange}
                                           open={true} input={false} value={this.selectDate()}/> : null}

        </div>
      );
    }
  })
  ;

module.exports = DateTimeCell;

//{this.dateTimeValue(cell.value)}
//{this.state.isEditing? : null}

/**
 * <span className='cell-content'>
 {this.dateTimeValue(cell.value)}
 </span>
 {this.state.isEditing?  : null}
 */
