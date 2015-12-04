var React = require('react');
var _ = require('lodash');
var Dispatcher = require('../../dispatcher/Dispatcher');


var BooleanCell = React.createClass({

  propTypes : {
    cell : React.PropTypes.object.isRequired,
    language : React.PropTypes.string.isRequired
  },

  getInitialState : function () {
    return {
      checked : !!this.props.cell.value
    }
  },

  componentDidMount : function () {
    console.log("Boolean did mount");
    console.log(this.props.cell.column);
    console.log(this.props.cell.tableId);
    console.log(this.props.cell.value);
  },

  handleCheckboxClick : function (e) {
    console.log(e.target.checked);
    this.setState({checked : !this.state.checked});

    //get the new value
    var newValue = 0;
    //this.handleEditDone(newValue);
  },

  handleEditDone : function (newValue) {
    Dispatcher.trigger(cell.changeCellEvent, {newValue : newValue});
  },

  getBooleanValueFromCell : function () {
    var cellValue = this.props.cell.value;
    return !!cellValue;
  },

  render : function () {
    var cell = this.props.cell;
    var language = this.props.language;

    return (
        <div className={'cell cell-' + cell.column.getId() + '-' + cell.rowId}>
          <input type="checkbox" checked={this.state.checked} onClick={this.handleCheckboxClick}/>
          {cell.value}
        </div>
    );

  }
});

module.exports = BooleanCell;
