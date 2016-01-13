var React = require('react');
var _ = require('lodash');
var Dispatcher = require('../../../dispatcher/Dispatcher');
var KeyboardShortcutsMixin = require('../../mixins/KeyboardShortcutsMixin');


var BooleanCell = React.createClass({

  mixins : [KeyboardShortcutsMixin],

  propTypes : {
    cell : React.PropTypes.object.isRequired,
    langtag : React.PropTypes.string.isRequired,
    selected : React.PropTypes.bool.isRequired
  },

  getInitialState : function () {
    return {
      checked : !!this.props.cell.value
    }
  },

  handleEditDone : function (newValue) {
    Dispatcher.trigger(this.props.cell.changeCellEvent, {newValue : newValue});
  },

  checkboxClick : function (event) {
    console.log("checkbox clicked");
    event.preventDefault();

    if (this.props.selected) {
      console.log("is selected!!!");
      var newVal = !this.state.checked;
      this.setState({
        checked : newVal
      });
      console.log("set to: ", newVal);
      this.handleEditDone(newVal);
    }

  },

  render : function () {
    var cell = this.props.cell;
    return (
        <div className={'cell-content'}>
          <input className="checkbox" type="checkbox" readOnly="readonly" checked={this.state.checked}
                 onClick={this.checkboxClick}/>
          {cell.value}
        </div>
    );

  }
});

module.exports = BooleanCell;
