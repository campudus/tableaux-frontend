var React = require('react');
var Dispatcher = require('../../../dispatcher/Dispatcher');
var OutsideClick = require('react-onclickoutside');
var Datetime = require('react-datetime');

var DateTimeEditCell = React.createClass({

    mixins : [OutsideClick],

    propTypes : {
      formatForUser : React.PropTypes.string,
      formatForServer : React.PropTypes.string,
      dateTimeValue : React.PropTypes.object,
      onDateTimeUpdate : React.PropTypes.func,
      handleEditDone : React.PropTypes.func,
      noDateTimeText : React.PropTypes.string,
      setCellKeyboardShortcuts : React.PropTypes.func
    },

    componentDidMount : function () {
      this.props.setCellKeyboardShortcuts(this.getKeyboardShortcuts());
    },

    componentWillUnmount : function () {
      this.props.handleEditDone();
      //Important to clean up the keyboard shortcuts
      this.props.setCellKeyboardShortcuts({});
    },

    getKeyboardShortcuts : function () {
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

    handleClickClearDate : function (event) {
      console.log("clicked handleClickClearDate");
      event.preventDefault();
      event.stopPropagation();
      this.props.onDateTimeUpdate(null);
      Dispatcher.trigger('toggleCellEditing', {editing : false});
    },

    handleClickOutside : function (event) {
      Dispatcher.trigger('toggleCellEditing', {editing : false});
    },

    showDateTimeValue : function () {
      return this.props.dateTimeValue === null ? this.props.noDateTimeText : this.props.dateTimeValue.format(this.props.formatForUser);
    },

    render : function () {
      return (
        <div>
          {this.showDateTimeValue()}
          <i className="fa fa-ban" onClick={this.handleClickClearDate}></i>
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
