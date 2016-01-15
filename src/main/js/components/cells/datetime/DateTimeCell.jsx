var React = require('react');
var ReactDOM = require('react-dom');
var _ = require('lodash');
var Dispatcher = require('../../../dispatcher/Dispatcher');
var OutsideClick = require('react-onclickoutside');
var Datetime = require('react-datetime');
var Moment = require('moment');
var KeyboardShortcutsMixin = require('../../mixins/KeyboardShortcutsMixin');

var DateTimeCell = React.createClass({

      mixins : [OutsideClick, KeyboardShortcutsMixin],
      propTypes : {
        cell : React.PropTypes.object.isRequired,
        langtag : React.PropTypes.string.isRequired,
        editing : React.PropTypes.bool.isRequired
      },

      statics : {
        formatForServer : "YYYY-MM-DDTHH:mm:SS.SSSZ",
        formatForUser : "DD.MM.YYYY - HH:mm",
      },

      /**
       * FIXME: Unbedingt in DateTimeEditCell auslagern damit Events nur bei selection benötigt werden, aktuell erhält jede Zelle das Event
       *
       */
      /*componentDidMount : function () {
       /!*
       * important: last parameter 'useCapture' must be true. This starts event handling at the beginning and allows to
       * stop propagation to the table key listener
       *!/
       document.addEventListener('keydown', this.onKeyboardShortcut, true);
       },

       componentWillUnmount : function () {
       //parameter useCapture must be true or added listener doesn't get removed
       document.removeEventListener('keydown', this.onKeyboardShortcut, true);
       },*/

      getInitialState : function () {
        return {
          selectedDateTime : null
        }
      },

      getKeyboardShortcuts : function (event) {
        var self = this;
        return {
          tab : function (event) {
            self.handleEditDone(event);
            Dispatcher.trigger('selectNextCell', 'right');
          },
          enter : function (event) {
            //stop handling the Table events
            self.handleEditDone(event);
            Dispatcher.trigger('selectNextCell', 'down');
          }
        };
      },

      handleClickOutside : function (event) {

        /*event.preventDefault();
         event.stopPropagation();*/
        console.log("dateTime clicked Outside");
        if (this.props.editing) {
          this.handleEditDone();
        }

      },

      handleLabelClick : function (event) {
        event.stopPropagation();
        event.preventDefault();
      },

      handleEditDone : function () {

        var selectedDateTime = this.state.selectedDateTime;

        if (this.props.editing && selectedDateTime) {

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

        console.log("in handleEditDone fn");
        Dispatcher.trigger('toggleCellEditing', {
          cell : this.props.cell,
          editing : false
        });
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
        if (this.props.editing) {
          theClassName += ' editing';
        }
        return (
            <div className={theClassName}>
              {this.showDateTimeValue()}
              {this.props.editing? <Datetime onChange={this.onDateTimeChange}
                                             open={true} input={false} value={this.selectDate()}/> : null}

            </div>
        );
      }
    })
    ;

module.exports = DateTimeCell;
