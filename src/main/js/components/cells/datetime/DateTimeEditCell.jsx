var React = require('react');
var OutsideClick = require('react-onclickoutside');
var Datetime = require('react-datetime');
var ActionCreator = require('../../../actions/ActionCreator');
var Directions = require('../../../constants/TableauxConstants').Directions;

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
          ActionCreator.toggleCellEditing(false);
          ActionCreator.selectNextCell(Directions.RIGHT);
        },
        enter : function () {
          ActionCreator.toggleCellEditing(false);
          ActionCreator.selectNextCell(Directions.DOWN);
        },
        escape : function () {
          ActionCreator.toggleCellEditing(false);
        },
        always : function (event) {
          event.preventDefault();
          event.stopPropagation();
        }
      };
    },

    handleClickClearDate : function (event) {
      event.preventDefault();
      event.stopPropagation();
      this.props.onDateTimeUpdate(null);
      ActionCreator.toggleCellEditing(false);
    },

    handleClickOutside : function (event) {
      ActionCreator.toggleCellEditing(false);
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
