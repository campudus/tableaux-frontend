var React = require('react');
var Dispatcher = require('../../../dispatcher/Dispatcher');
var KeyboardShortcutsMixin = require('../../mixins/KeyboardShortcutsMixin');
var BooleanEditCell = require('./BooleanEditCell.jsx');

var BooleanCell = React.createClass({

  mixins : [KeyboardShortcutsMixin],

  propTypes : {
    cell : React.PropTypes.object.isRequired,
    langtag : React.PropTypes.string.isRequired,
    selected : React.PropTypes.bool.isRequired,
    setCellKeyboardShortcuts: React.PropTypes.func
  },

  handleEditDone : function (newValue) {
    Dispatcher.trigger(this.props.cell.changeCellEvent, {newValue : newValue});
  },

  getCheckboxValue : function () {
    return !!this.props.cell.value;
  },

  /**
   * Toggle value only when selected, changes it visually and saves it to database
   */
  toggleCheckboxValue : function () {
    var newVal = !this.getCheckboxValue();
    this.handleEditDone(newVal);
  },

  render : function () {

    var booleanCellNode;
    //We split this simple boolean into two components to get the keydown listener just once when selected!
    if (!this.props.selected) {
      booleanCellNode =
          <input className="checkbox" type="checkbox" readOnly="readonly" checked={this.getCheckboxValue()}/>;
    } else {
      booleanCellNode = <BooleanEditCell checked={this.getCheckboxValue()}
                                         langtag={this.props.langtag}
                                         onSave={this.toggleCheckboxValue}
                                         setCellKeyboardShortcuts={this.props.setCellKeyboardShortcuts}/>;
    }

    return (
        <div className={'cell-content'}>
          {booleanCellNode}
        </div>
    );

  }
});

module.exports = BooleanCell;
