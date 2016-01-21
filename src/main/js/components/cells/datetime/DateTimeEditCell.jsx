var React = require('react');
var Dispatcher = require('../../../dispatcher/Dispatcher');
var OutsideClick = require('react-onclickoutside');
var KeyboardShortcutsMixin = require('../../mixins/KeyboardShortcutsMixin');
var Datetime = require('react-datetime');

var DateTimeEditCell = React.createClass({

      mixins : [KeyboardShortcutsMixin, OutsideClick],

      propTypes : {
        formatForUser : React.PropTypes.string,
        formatForServer : React.PropTypes.string,
        dateTimeValue : React.PropTypes.object,
        onDateTimeUpdate : React.PropTypes.func,
        handleEditDone : React.PropTypes.func,
        noDateTimeText : React.PropTypes.string
      },

      componentDidMount : function () {
        /*
         * important: last parameter 'useCapture' must be true. This starts event handling at the beginning and allows to
         * stop propagation to the table key listener
         */
        document.addEventListener('keydown', this.onKeyboardShortcut, true);
      },

      componentWillUnmount : function () {
        this.props.handleEditDone();
        //parameter useCapture must be true or added listener doesn't get removed
        document.removeEventListener('keydown', this.onKeyboardShortcut, true);
      },

      getKeyboardShortcuts : function (event) {
        return {
          tab : function () {
            Dispatcher.trigger('toggleCellEditing', {editing : false});
            Dispatcher.trigger('selectNextCell', 'right');
          },
          enter : function () {
            Dispatcher.trigger('toggleCellEditing', {editing : false});
            Dispatcher.trigger('selectNextCell', 'down');
          },
          escape : function () {
            Dispatcher.trigger('toggleCellEditing', {editing : false});
          },
          always : function (event) {
            event.preventDefault();
            event.stopPropagation();
          }
        };
      },

      handleClickOutside : function (event) {
        Dispatcher.trigger('toggleCellEditing', {editing : false});
      },

      showDateTimeValue : function () {
        return this.props.dateTimeValue ? this.props.dateTimeValue.format(this.props.formatForUser) : this.props.noDateTimeText;
      },

      render : function () {
        return (
            <div>
              {this.showDateTimeValue()}
              <Datetime onChange={this.props.onDateTimeUpdate}
                        open={true}
                        input={false}
                        value={this.props.dateTimeValue}/>

            </div>
        );
      }
    })
    ;

module.exports = DateTimeEditCell;
