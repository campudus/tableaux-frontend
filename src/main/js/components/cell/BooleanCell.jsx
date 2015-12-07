var React = require('react');
var _ = require('lodash');
var Dispatcher = require('../../dispatcher/Dispatcher');


var BooleanCell = React.createClass({

  propTypes : {
    cell : React.PropTypes.object.isRequired
  },

  getInitialState : function () {
    return {
      checked : !!this.props.cell.value
    }
  },

  handleCheckboxClick : function (e) {
    var newVal = e.target.checked;
    this.setState({checked : newVal});
    this.handleEditDone(newVal);
  },

  handleEditDone : function (newValue) {
    Dispatcher.trigger(this.props.cell.changeCellEvent, {newValue : newValue});
  },

  render : function () {
    var cell = this.props.cell;
    return (
      <div className={'cell holds-checkbox cell-' + cell.column.getId() + '-' + cell.rowId}>
        <input className="checkbox" type="checkbox" checked={this.state.checked} onChange={this.handleCheckboxClick}/>
        {cell.value}
      </div>
    );

  }
});

module.exports = BooleanCell;
